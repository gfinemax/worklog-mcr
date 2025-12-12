"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { RobotMascot } from "@/components/characters/robot-mascot"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Check, Users, User, Lock, LogIn, Info, Search, Plus, X, Briefcase, Monitor } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { authService } from "@/lib/auth"
import { toast } from "sonner"
import { useAuthStore, SessionMember } from "@/store/auth"
import { supabase } from "@/lib/supabase"
import { shiftService, ShiftInfo } from "@/lib/shift-rotation"
import { LoginForm } from "@/components/auth/login-form"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<"login" | "mode-selection" | "session-setup">("login")
  const [loading, setLoading] = useState(false)

  const {
    user: globalUser,
    group: globalGroup,
    setUser: setGlobalUser,
    setGroup: setGlobalGroup,
    setSession: setGlobalSession,
    setLoginMode,
    logout
  } = useAuthStore()

  // Session Setup State
  const [sessionMembers, setSessionMembers] = useState<SessionMember[]>([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchMode, setSearchMode] = useState<'substitute' | 'add'>('add')
  const [targetMemberId, setTargetMemberId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [availableRoles, setAvailableRoles] = useState<string[]>(["감독", "부감독", "영상"])
  const [currentShiftType, setCurrentShiftType] = useState<string | null>(null)

  // Fetch Roles on Mount
  useEffect(() => {
    const fetchRoles = async () => {
      const { data } = await supabase.from("roles").select("name").eq("type", "both").order("order")
      if (data) {
        const roleNames = data.map(r => r.name)
        if (roleNames.length > 0) setAvailableRoles(roleNames)
      }
    }
    fetchRoles()
  }, [])

  const handleLoginSuccess = () => {
    checkUserGroup()
  }

  const checkUserGroup = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const userGroup = await authService.getUserGroup(user.id)
    if (userGroup) {
      const groupData = Array.isArray(userGroup) ? userGroup[0] : userGroup
      setGlobalGroup(groupData)
      setStep("mode-selection")
    } else {
      setLoginMode('personal')
      router.push("/dashboard")
    }
  }

  const handleModeSelect = (mode: 'shift' | 'personal') => {
    if (mode === 'personal') {
      setLoginMode('personal')
      router.push("/dashboard")
    } else {
      prepareSessionSetup()
    }
  }

  const prepareSessionSetup = async () => {
    if (!globalGroup) return

    setLoading(true)
    try {
      const { data: memberData } = await supabase
        .from('group_members')
        .select(`
                user_id,
                role,
                display_order,
                users (
                    id,
                    name,
                    profile_image_url
                )
            `)
        .eq('group_id', globalGroup.id)
        .order('display_order', { ascending: true })

      if (memberData) {
        // Prepare User Map for Roster Lookup (Name -> User Object)
        const userMap = new Map<string, any>()
        memberData.forEach((m: any) => {
          if (m.users) {
            userMap.set(m.users.name, m.users)
          }
        })

        const today = new Date()
        const shiftConfig = await shiftService.getConfig(today)
        let shiftInfo: ShiftInfo | null = null
        let initialMembers: SessionMember[] = []

        if (shiftConfig) {
          shiftInfo = shiftService.calculateShift(today, globalGroup.name, shiftConfig)
          if (shiftInfo) {
            setCurrentShiftType(shiftInfo.shiftType)
          }

          // 1. Try Roster JSON (SSoT)
          if (shiftConfig.roster_json?.[globalGroup.name]) {
            const rosterMembers = shiftService.getMembersWithRoles(globalGroup.name, today, shiftConfig)

            rosterMembers.forEach(rm => {
              const user = userMap.get(rm.name)
              if (user) {
                initialMembers.push({
                  id: user.id,
                  name: user.name,
                  role: rm.role,
                  profile_image_url: user.profile_image_url
                })
              }
            })
          }
        } else {
          setCurrentShiftType(null)
        }

        // 2. Fallback to group_members (if roster_json didn't yield results)
        if (initialMembers.length === 0) {
          initialMembers = memberData
            .filter((m: any) => m.users)
            .map((m: any) => ({
              id: m.users.id,
              name: m.users.name,
              role: "영상", // Default role
              profile_image_url: m.users.profile_image_url
            }))

          if (shiftInfo) {
            // Apply index-based roles if Swap/Pattern logic exists
            const { director, assistant } = shiftInfo.roles
            initialMembers.forEach((m, i) => {
              if (i === director) m.role = "감독"
              else if (i === assistant) m.role = "부감독"
              else m.role = "영상"
            })
          } else {
            // Apply DB roles
            memberData.forEach((m: any, i: number) => {
              if (m.role) initialMembers[i].role = m.role
            })
          }
        }

        setSessionMembers(initialMembers)
        setStep("session-setup")
      }
    } catch (error: any) {
      console.error("prepareSessionSetup Error:", error)
      toast.error(`멤버 정보를 불러오는데 실패했습니다: ${error?.message || '알 수 없는 오류'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleStartSession = async () => {
    if (!globalGroup || !globalUser) return

    const hasDirector = sessionMembers.some(m => m.role === '감독')
    if (!hasDirector) {
      const confirmStart = confirm("감독이 지정되지 않았습니다. 그래도 근무를 시작하시겠습니까?")
      if (!confirmStart) return
    }

    setLoading(true)
    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('work_sessions')
        .insert({
          group_id: globalGroup.id,
          date: new Date().toISOString().split('T')[0],
          start_time: new Date().toISOString(),
          status: 'active'
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      const membersToInsert = sessionMembers.map(m => ({
        session_id: sessionData.id,
        user_id: m.id,
        name: m.name,
        role: m.role,
        is_substitute: m.isSubstitute || false,
        original_member_name: m.originalMemberId ? sessionMembers.find(om => om.id === m.originalMemberId)?.name : null
      }))

      const { error: membersError } = await supabase
        .from('work_session_members')
        .insert(membersToInsert)

      if (membersError) throw membersError

      setLoginMode('shift')
      setGlobalSession({
        id: sessionData.id,
        groupId: globalGroup.id,
        groupName: globalGroup.name,
        members: sessionMembers,
        startedAt: sessionData.start_time
      })

      toast.success(`${globalGroup.name} 근무 세션이 시작되었습니다.`)
      router.push("/dashboard")
    } catch (error: any) {
      console.error("Session Start Error:", error)
      toast.error("세션 시작 실패: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRoleChange = (memberId: string, newRole: string) => {
    setSessionMembers(prev => prev.map(m =>
      m.id === memberId ? { ...m, role: newRole } : m
    ))
  }

  const openSearch = (mode: 'substitute' | 'add', memberId?: string) => {
    setSearchMode(mode)
    setTargetMemberId(memberId || null)
    setSearchQuery("")
    setSearchResults([])
    setIsSearchOpen(true)
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.length < 1) {
      setSearchResults([])
      return
    }

    const { data: users } = await supabase
      .from('users')
      .select('id, name, role, profile_image_url, type')
      .ilike('name', `%${query}%`)
      .limit(10)

    const formattedUsers = (users || []).map((u: any) => ({
      ...u,
      // Map DB type 'support' to UI type 'external' (displays as '지원')
      type: u.type === 'support' ? 'external' : 'internal'
    }))
    setSearchResults(formattedUsers)
  }

  const handleSelectWorker = (worker: any) => {
    if (searchMode === 'substitute' && targetMemberId) {
      setSessionMembers(prev => prev.map(m => {
        if (m.id === targetMemberId) {
          return {
            id: worker.id,
            name: worker.name,
            role: m.role,
            isSubstitute: true,
            originalMemberId: m.id,
            profile_image_url: worker.profile_image_url
          }
        }
        return m
      }))
      toast.success(`${worker.name}님으로 교체되었습니다.`)
    } else {
      if (sessionMembers.find(m => m.id === worker.id)) {
        toast.error("이미 목록에 있는 근무자입니다.")
        return
      }
      setSessionMembers(prev => [...prev, {
        id: worker.id,
        name: worker.name,
        role: '영상',
        isSubstitute: false,
        profile_image_url: worker.profile_image_url
      }])
      toast.success(`${worker.name}님이 추가되었습니다.`)
    }
    setIsSearchOpen(false)
  }

  const handleRemoveMember = (memberId: string) => {
    setSessionMembers(prev => prev.filter(m => m.id !== memberId))
  }

  const handleSessionReset = () => {
    if (confirm("세션 정보를 강제로 초기화하시겠습니까? 로그인 상태가 해제됩니다.")) {
      logout()
      setStep("login")
      toast.info("세션이 초기화되었습니다.")
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background">
      {/* Left Panel with Shader */}
      <div className="lg:w-1/2 relative bg-[#0f172a] flex flex-col overflow-hidden transition-all duration-500 ease-in-out">
        {/* Top Branding Section */}
        <div className="relative z-20 p-8 lg:p-12 flex flex-col items-start">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 shadow-lg">
              <span className="text-xl font-bold text-white">M</span>
            </div>
            <span className="text-white/90 font-medium tracking-wider text-sm">MBC PLUS MCR</span>
          </div>

          <div className="space-y-2 max-w-md">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
              주조정실
              <br />
              <span className="text-blue-400">디지털 업무일지</span> 시스템
            </h1>
            <p className="text-blue-200/80 text-base lg:text-lg font-light">
              효율적인 방송 송출 관리를 위한 스마트 워크스페이스
            </p>
          </div>
        </div>

        {/* Center Shader Visual */}
        <div className="flex-1 relative flex items-center justify-center w-full min-h-[300px]">
          <div className="relative z-10 scale-110 lg:scale-125 transition-transform duration-700 hover:scale-130">
            <RobotMascot />
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/20 blur-[100px] rounded-full pointer-events-none" />
        </div>

        {/* Bottom Notice Section */}
        <div className="relative z-20 p-8 lg:p-12">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-5 transition-all hover:bg-white/10">
            <div className="flex items-center gap-2 text-blue-300 mb-3">
              <Info className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">System Notice</span>
            </div>
            <ul className="space-y-2">
              <li className="text-sm text-blue-100/80 flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-blue-400 mt-2 shrink-0" />
                정기 점검: 매주 수요일 02:00 ~ 04:00
              </li>
              <li className="text-sm text-blue-100/80 flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-blue-400 mt-2 shrink-0" />
                비밀번호는 3개월마다 변경해주세요.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white dark:bg-zinc-950">
        <div className="w-full max-w-[420px] space-y-8">

          {step === "login" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2 text-center lg:text-left">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">로그인</h2>
                <p className="text-slate-500 dark:text-slate-400">업무일지 시스템 접속을 위해 인증해주세요</p>
              </div>

              <LoginForm onSuccess={handleLoginSuccess} />

              <div className="flex flex-col space-y-4 mt-10 pt-6 border-t border-slate-100">
                <p className="text-center text-sm text-slate-500">
                  계정이 없으신가요?{" "}
                  <Link href="/signup" className="text-blue-600 font-semibold hover:underline">
                    계정 만들기
                  </Link>
                </p>
                <div className="flex justify-center">
                  <Button variant="link" className="text-xs text-slate-400" onClick={handleSessionReset}>
                    세션 초기화 (비상용)
                  </Button>
                </div>
                <p className="text-center text-xs text-slate-400 font-light">Copyright © MBC PLUS. All rights reserved.</p>
              </div>
            </div>
          )}

          {step === "mode-selection" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-2 text-center">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">접속 모드 선택</h2>
                <p className="text-slate-500 text-sm">원하시는 업무 모드를 선택해주세요.</p>
              </div>

              <div className="grid gap-4">
                <div
                  onClick={() => handleModeSelect('shift')}
                  className="cursor-pointer group relative flex flex-col gap-2 rounded-xl border-2 border-slate-200 p-6 hover:border-blue-500 hover:bg-blue-50/50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <Monitor className="h-6 w-6" />
                    </div>
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">현장 근무</Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-slate-900">조별 모드 (Shift Mode)</h3>
                    <p className="text-sm text-slate-500">
                      근무를 시작하고 업무일지를 작성합니다.<br />
                      근무자 확정 및 운행표 관리가 가능합니다.
                    </p>
                  </div>
                </div>

                <div
                  onClick={() => handleModeSelect('personal')}
                  className="cursor-pointer group relative flex flex-col gap-2 rounded-xl border-2 border-slate-200 p-6 hover:border-slate-500 hover:bg-slate-50 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-slate-100 text-slate-600 rounded-lg group-hover:bg-slate-800 group-hover:text-white transition-colors">
                      <Briefcase className="h-6 w-6" />
                    </div>
                    <Badge variant="outline">개인 업무</Badge>
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg text-slate-900">개인 모드 (Personal Mode)</h3>
                    <p className="text-sm text-slate-500">
                      개인 업무를 처리하거나 지난 일지를 확인합니다.<br />
                      결재, 댓글 작성, 본인 글 수정이 가능합니다.
                    </p>
                  </div>
                </div>
              </div>

              <Button variant="ghost" className="w-full" onClick={() => setStep("login")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> 다른 계정으로 로그인
              </Button>
            </div>
          )}

          {step === "session-setup" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("mode-selection")}
                  className="text-slate-500 hover:text-slate-900"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" /> 뒤로가기
                </Button>
                <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  {globalGroup?.name || "소속 없음"} {currentShiftType && `(${currentShiftType})`}
                </span>
              </div>

              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">근무자 확정</h2>
                <p className="text-slate-500 text-sm">오늘 함께 근무할 멤버와 역할을 확인해주세요.</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-slate-500 pl-1 text-xs uppercase tracking-wider font-semibold">
                    현재 멤버 ({sessionMembers.length}명)
                  </Label>
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-blue-600 hover:text-blue-700" onClick={() => openSearch('add')}>
                    <Plus className="h-3 w-3 mr-1" /> 근무자 추가
                  </Button>
                </div>

                <div className="space-y-3">
                  {sessionMembers.map((member) => (
                    <div
                      key={member.id}
                      className="relative flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200"
                    >
                      <Avatar className="h-10 w-10 border border-slate-100">
                        <AvatarImage src={member.profile_image_url} />
                        <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">
                          {member.name[0]}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-slate-700">{member.name}</span>
                          {member.isSubstitute && (
                            <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-orange-100 text-orange-700">교체됨</Badge>
                          )}
                        </div>
                        {/* Role Selector */}
                        <Select value={member.role} onValueChange={(val) => handleRoleChange(member.id, val)}>
                          <SelectTrigger className="h-7 text-xs border-none shadow-none p-0 focus:ring-0 w-fit gap-1 text-slate-500 font-medium">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableRoles.map(role => (
                              <SelectItem key={role} value={role} className="text-xs">{role}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-xs text-slate-400 hover:text-blue-600"
                          onClick={() => openSearch('substitute', member.id)}
                        >
                          교체
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-600"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleStartSession}
                disabled={loading || sessionMembers.length === 0}
                className="w-full h-12 mt-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all font-medium text-base"
              >
                {loading ? "세션 시작 중..." : "근무 시작하기"}
              </Button>

              {/* Worker Search Dialog */}
              <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>{searchMode === 'substitute' ? '근무자 교체' : '근무자 추가'}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="이름 검색..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                      />
                    </div>
                    <ScrollArea className="h-[200px] rounded-md border p-2">
                      {searchResults.length === 0 ? (
                        <div className="text-center text-sm text-muted-foreground py-8">
                          검색 결과가 없습니다.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {searchResults.map((worker) => (
                            <div
                              key={`${worker.type}-${worker.id}`}
                              className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                              onClick={() => handleSelectWorker(worker)}
                            >
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={worker.profile_image_url} />
                                  <AvatarFallback>{worker.name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium">{worker.name}</span>
                                  <span className="text-xs text-muted-foreground">{worker.role}</span>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-[10px]">
                                {worker.type === 'internal' ? '순환' : '지원'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
