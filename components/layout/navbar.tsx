"use client"

import { Bell, Search, Menu, LogOut, Users, User, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
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
import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"

// Mock data for demonstration
const TEAM_MEMBERS = [
  { id: 1, name: "김철수", role: "팀원" },
  { id: 2, name: "이영희", role: "팀원" },
  { id: 3, name: "박민수", role: "팀장" },
]

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
    message: "김철수님이 '송출 장비 점검' 일지를 작성했습니다.",
    time: "1시간 전",
    read: false,
  },
  { id: 3, title: "비밀번호 변경 알림", message: "비밀번호 변경 3개월이 지났습니다.", time: "1일 전", read: true },
]

type LoginMode = "TEAM" | "INDIVIDUAL"

export function Navbar() {
  const router = useRouter()
  // State to simulate different login modes for demonstration
  const [loginMode, setLoginMode] = useState<LoginMode>("TEAM")
  const [teamName] = useState("MCR1")
  const [selectedMember, setSelectedMember] = useState<(typeof TEAM_MEMBERS)[0] | null>(TEAM_MEMBERS[0])
  const [notifications, setNotifications] = useState(NOTIFICATIONS)
  const unreadCount = notifications.filter((n) => !n.read).length

  const toggleMode = () => {
    if (loginMode === "TEAM") {
      setLoginMode("INDIVIDUAL")
      setSelectedMember(null)
    } else {
      setLoginMode("TEAM")
      setSelectedMember(TEAM_MEMBERS[0])
    }
  }

  return (
    <header className="fixed left-64 right-0 top-0 z-30 h-16 border-b border-border bg-card">
      <div className="flex h-full items-center justify-between px-6">
        {/* Left side - Search */}
        <div className="flex items-center gap-4 flex-1 max-w-xl">
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="search" placeholder="업무일지, 포스트 검색..." className="pl-9 bg-muted/50" />
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 border-r pr-4 mr-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 pl-2 pr-1 h-12 rounded-full hover:bg-accent">
                  <div className="flex flex-col items-end gap-0.5 text-right mr-1">
                    <div className="flex items-center gap-1.5">
                      {loginMode === "TEAM" ? (
                        <Badge
                          variant="secondary"
                          className="h-5 px-1.5 text-[10px] font-medium bg-blue-100 text-blue-700 hover:bg-blue-100"
                        >
                          {teamName}
                        </Badge>
                      ) : (
                        <Badge
                          variant="secondary"
                          className="h-5 px-1.5 text-[10px] font-medium bg-slate-100 text-slate-700 hover:bg-slate-100"
                        >
                          개인
                        </Badge>
                      )}
                      <span className="text-sm font-semibold">
                        {loginMode === "TEAM" ? (selectedMember ? selectedMember.name : "팀 계정") : "홍길동"}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {loginMode === "TEAM" ? (selectedMember ? "팀원으로 작성 중" : "팀 관리 모드") : "개인 업무 모드"}
                    </span>
                  </div>
                  <Avatar className="h-9 w-9 border-2 border-background ring-2 ring-muted">
                    <AvatarImage src={loginMode === "TEAM" ? "/placeholder-user.jpg" : "/placeholder-avatar.jpg"} />
                    <AvatarFallback
                      className={loginMode === "TEAM" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"}
                    >
                      {loginMode === "TEAM" ? (selectedMember ? selectedMember.name[0] : teamName[0]) : "홍"}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-muted-foreground opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  {loginMode === "TEAM" ? "팀원 선택 (작성자 전환)" : "계정 정보"}
                </DropdownMenuLabel>

                {loginMode === "TEAM" && (
                  <>
                    <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => setSelectedMember(null)}>
                      <Users className="h-4 w-4" />
                      <span>{teamName} (팀 공통)</span>
                      {!selectedMember && (
                        <Badge variant="outline" className="ml-auto text-[10px]">
                          선택됨
                        </Badge>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {TEAM_MEMBERS.map((member) => (
                      <DropdownMenuItem
                        key={member.id}
                        className="gap-2 cursor-pointer"
                        onClick={() => setSelectedMember(member)}
                      >
                        <User className="h-4 w-4" />
                        <span>{member.name}</span>
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
                  <LogOut className="h-4 w-4" />
                  <span>{loginMode === "TEAM" ? "개인 로그인으로 전환 (데모)" : "팀 로그인으로 전환 (데모)"}</span>
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

          <Button variant="ghost" size="icon" onClick={() => router.push("/login")}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
