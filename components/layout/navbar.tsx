"use client"

import { Bell, Search, Menu, LogOut, Users, User, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"

import { useAuthStore } from "@/store/auth"
import { PinVerificationDialog } from "@/components/auth/pin-verification-dialog"

const NOTIFICATIONS = [
  {
    id: 1,
    title: "시스템 점검 안내",
    message: "내일 오전 2시부터 점검이 예정되어 있습니다.",
    time: "10분 전",
    read: false,
  },
  {
    id: 2,
    title: "새로운 업무일지",
    message: "오학동님이 '송출 장비 점검' 일지를 작성했습니다.",
    time: "1시간 전",
    read: false,
  },
  { id: 3, title: "비밀번호 변경 알림", message: "비밀번호 변경 3개월이 지났습니다.", time: "1일 전", read: true },
]

type LoginMode = "TEAM" | "INDIVIDUAL"

export function Navbar() {
  const router = useRouter()
  const { user, group, currentSession, activeMemberId, setActiveMemberId } = useAuthStore()

  // State to simulate different login modes for demonstration
  const [loginMode, setLoginMode] = useState<LoginMode>("TEAM")
  const [pinDialogOpen, setPinDialogOpen] = useState(false)
  const [pendingMemberId, setPendingMemberId] = useState<string | null>(null)
  const [shiftType, setShiftType] = useState<string | null>(null)

  // Derive selected member from activeMemberId
  const selectedMember = activeMemberId && currentSession?.members
    ? currentSession.members.find(m => m.id === activeMemberId) || null
    : null

  // Initialize active member with current user if available and not set
  useEffect(() => {
    if (user && loginMode === 'TEAM') {
      // If activeMemberId is already set, don't overwrite it unless it's invalid
      if (activeMemberId) {
        return
      }

      // If not set, default to logged-in user
      if (currentSession?.members) {
        const sessionUser = currentSession.members.find(m => m.id === user.id)
        if (sessionUser) {
          setActiveMemberId(sessionUser.id)
          return
        }
      }
      // Fallback
      if (user.id) setActiveMemberId(user.id)
    }
  }, [user, loginMode, currentSession, activeMemberId, setActiveMemberId])

  useEffect(() => {
    const loadShiftInfo = async () => {
      if (currentSession?.groupName) {
        try {
          const { shiftService } = await import("@/lib/shift-rotation")
          const config = await shiftService.getConfig()
          if (config) {
            const info = shiftService.calculateShift(new Date(), currentSession.groupName, config)
            setShiftType(info.shiftType)
          }
        } catch (error) {
          console.error("Failed to load shift info:", error)
        }
      }
    }
    loadShiftInfo()
  }, [currentSession])

  const [notifications, setNotifications] = useState(NOTIFICATIONS)
  const unreadCount = notifications.filter((n) => !n.read).length

  const toggleMode = () => {
    if (loginMode === "TEAM") {
      setLoginMode("INDIVIDUAL")
      setActiveMemberId(null)
    } else {
      setLoginMode("TEAM")
      // Default to first member of session or user
      const defaultId = currentSession?.members[0]?.id || user?.id || null
      setActiveMemberId(defaultId)
    }
  }

  const handleMemberSwitchRequest = async (memberId: string) => {
    // 1. Check if PIN is required
    const requirePin = useAuthStore.getState().securitySettings?.requirePinForMemberSwitch ?? true

    if (!requirePin) {
      // If PIN not required, switch immediately
      await performMemberSwitch(memberId)
      return
    }

    // 2. If PIN required, open dialog
    setPendingMemberId(memberId)
    setPinDialogOpen(true)
  }

  const handlePinSuccess = async () => {
    if (pendingMemberId) {
      await performMemberSwitch(pendingMemberId)
      setPendingMemberId(null)
      setPinDialogOpen(false)
    }
  }

  const performMemberSwitch = async (memberId: string) => {
    let targetId = memberId
    if (memberId === "GROUP_COMMON") {
      setActiveMemberId("GROUP_COMMON")
      // Restore to Group Account (User)
      // We need to fetch the group account user profile. 
      // Ideally, we should have the original user stored or fetch it.
      // For now, if we are in TEAM mode, the 'user' might be overwritten.
      // But wait, if we switch to a member, 'user' becomes that member.
      // If we switch back to GROUP_COMMON, we need the original user.
      // The original user ID is usually the one who logged in. 
      // But we might have lost it if we overwrote 'user'.
      // However, we are not overwriting the session.user (Supabase Auth).
      // So we can fetch the session user again.
      const { data: { session } } = await import("@/lib/supabase").then(m => m.supabase.auth.getSession())
      if (session?.user) {
        targetId = session.user.id
      }
    } else {
      setActiveMemberId(memberId)
    }

    // Fetch profile and update 'user' store
    const { supabase } = await import("@/lib/supabase")
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', targetId)
      .single()

    if (profile) {
      useAuthStore.getState().setUser(profile)
      // Force a router refresh to ensure components re-render with new user
      router.refresh()
    }
  }

  // Prepare members list for PIN dialog
  // If switching to a specific member, show only that member
  // If switching to Team Common, show the Group Account (user)
  const pinTargetMembers = pendingMemberId
    ? (pendingMemberId === "GROUP_COMMON"
      ? (user ? [{ id: user.id, name: group?.name || user.name, role: '관리자', profile_image_url: user.profile_image_url }] : [])
      : (currentSession?.members?.filter(m => m.id === pendingMemberId) || [])
    )
    : []
  // Determine target ID for the dialog (for auto-selection)
  const pinTargetId = pendingMemberId === "GROUP_COMMON" ? user?.id : pendingMemberId

  const handleLogout = async () => {
    try {
      // Check if user is Admin/Support type before clearing state
      const isSupport = user?.type === 'support'

      const { supabase } = await import("@/lib/supabase")
      await supabase.auth.signOut()

      // Use the store's logout action to clear all state
      useAuthStore.getState().logout()

      if (isSupport) {
        // Silent logout for Admin (stay on page)
        router.refresh()
        toast.success("관리자 로그아웃 완료")
      } else {
        // Standard logout for workers (Shift Handover, etc.) -> Redirect to Login
        router.push("/login")
      }
    } catch (error) {
      console.error("Logout failed:", error)
      router.push("/login")
    }
  }

  return (
    <>
      <header className="fixed left-64 right-0 top-0 z-30 h-16 border-b border-border bg-card print:hidden">
        <div className="flex h-full items-center justify-between px-6 gap-4">
          {/* Left side - Search */}
          < div className="flex items-center gap-4 flex-1 max-w-xl" >
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="search" placeholder="업무일지, 포스트 검색..." className="pl-9 bg-muted/50" />
            </div>
          </div >

          {/* Right side - Actions */}
          < div className="flex items-center gap-4" >
            <div className="flex items-center gap-3 border-r pr-4 mr-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 pl-2 pr-1 h-9 rounded-full border shadow-sm bg-white hover:bg-slate-50 text-foreground"
                  >
                    <div className="flex items-center gap-2 mr-1">
                      {loginMode === "TEAM" ? (
                        <Badge
                          variant="secondary"
                          className="h-5 px-1.5 text-[10px] font-medium bg-blue-100 text-blue-700 hover:bg-blue-100"
                        >
                          {group?.name || "소속 없음"}
                          {shiftType && (shiftType === 'A' || shiftType === 'N') && (
                            <span className="text-blue-600 font-bold ml-0.5">
                              {shiftType}
                            </span>
                          )}
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="h-5 px-1.5 text-[10px] font-medium bg-slate-100 text-slate-700 hover:bg-slate-100"
                        >
                          개인
                        </Badge>
                      )}
                      <span className="text-xs font-semibold text-foreground">
                        {loginMode === "TEAM" ? (selectedMember ? selectedMember.name : "대표") : (user?.name || "사용자")}
                        <span className="font-normal ml-1 text-muted-foreground">작성중</span>
                      </span>
                    </div>
                    <Avatar className="h-6 w-6 border border-background ring-1 ring-muted">
                      <AvatarImage src={loginMode === "TEAM" ? "/placeholder-user.jpg" : "/placeholder-avatar.jpg"} />
                      <AvatarFallback
                        className={`text-[10px] ${loginMode === "TEAM" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"}`}
                      >
                        {loginMode === "TEAM" ? (selectedMember ? selectedMember.name[0] : group?.name?.[0]) : user?.name?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-3 w-3 opacity-50 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    {loginMode === "TEAM" ? "조원 선택 (작성자 전환)" : "계정 정보"}
                  </DropdownMenuLabel>

                  {loginMode === "TEAM" && (
                    <>
                      <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => handleMemberSwitchRequest("GROUP_COMMON")}>
                        <Users className="h-4 w-4" />
                        <span>{group?.name} (대표)</span>
                        {!selectedMember && (
                          <Badge variant="outline" className="ml-auto text-[10px]">
                            선택됨
                          </Badge>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {currentSession?.members
                        .sort((a, b) => {
                          const priority = { 감독: 1, 부감독: 2, 영상: 3 }
                          const pA = priority[a.role as keyof typeof priority] || 99
                          const pB = priority[b.role as keyof typeof priority] || 99
                          return pA - pB
                        })
                        .map((member) => (
                          <DropdownMenuItem
                            key={member.id}
                            className="gap-2 cursor-pointer"
                            onClick={() => handleMemberSwitchRequest(member.id)}
                          >
                            <User className="h-4 w-4" />
                            <span>{member.name}</span>
                            ({member.role})

                            {selectedMember?.id === member.id && (
                              <Badge variant="outline" className="ml-auto text-[10px]">
                                선택됨
                              </Badge>
                            )}
                          </DropdownMenuItem>
                        ))}
                    </>
                  )}

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={toggleMode} className="gap-2 text-muted-foreground cursor-pointer">
                    <Users className="h-4 w-4" />
                    <span>{loginMode === "TEAM" ? "개인 로그인으로 전환" : "조별 로그인으로 전환"}</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="gap-2 text-red-600 focus:text-red-700 cursor-pointer">
                    <LogOut className="h-4 w-4" />
                    <span>로그아웃</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-600 ring-2 ring-background animate-pulse" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between font-normal text-sm">
                  <span className="font-semibold">알림</span>
                  {unreadCount > 0 && (
                    <span className="text-xs text-muted-foreground">{unreadCount}개의 읽지 않은 알림</span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-[300px]">
                  {notifications.length > 0 ? (
                    <div className="grid gap-1 p-1">
                      {notifications.map((notification) => (
                        <DropdownMenuItem
                          key={notification.id}
                          className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                        >
                          <div className="flex w-full items-start justify-between gap-2">
                            <span
                              className={`text-sm font-medium ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}
                            >
                              {notification.title}
                            </span>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {notification.time}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{notification.message}</p>
                          {!notification.read && <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-600" />}
                        </DropdownMenuItem>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">알림이 없습니다.</div>
                  )}
                </ScrollArea>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="justify-center text-xs text-muted-foreground cursor-pointer">
                  모든 알림 지우기
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" onClick={handleLogout} title="로그아웃">
              <LogOut className="h-5 w-5" />
            </Button>
          </div >
        </div >
      </header >

      <PinVerificationDialog
        open={pinDialogOpen}
        onOpenChange={setPinDialogOpen}
        title="작성자 전환 인증"
        description="작성자를 전환하기 위해 PIN 번호를 입력해주세요."
        members={pinTargetMembers as any}
        onSuccess={handlePinSuccess}
        defaultSelectedId={pinTargetId}
      />
    </>
  )
}
