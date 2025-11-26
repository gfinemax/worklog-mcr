"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { RobotMascot } from "@/components/characters/robot-mascot"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Check, Users, User, Lock, LogIn, Info, Search, Plus, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { authService } from "@/lib/auth"
import { toast } from "sonner"
import { useAuthStore, SessionMember } from "@/store/auth"
import { supabase } from "@/lib/supabase"
import { WorkerRegistrationDialog } from "@/components/worker-registration-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  const [step, setStep] = useState<"login" | "session-setup">("login")
  const [loading, setLoading] = useState(false)

  const { setUser: setGlobalUser, setGroup: setGlobalGroup, setSession: setGlobalSession } = useAuthStore()

  // Login Form State
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // Session Setup State
  const [user, setUser] = useState<any>(null)
  const [group, setGroup] = useState<any>(null)
  const [sessionMembers, setSessionMembers] = useState<SessionMember[]>([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchMode, setSearchMode] = useState<'substitute' | 'add'>('add')
  const [targetMemberId, setTargetMemberId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [availableRoles, setAvailableRoles] = useState<string[]>(["감독", "부감독", "영상"])

  // Fetch Roles on Mount
  useEffect(() => {
    const fetchRoles = async () => {
      const { data } = await supabase.from("roles").select("name").eq("type", "both").order("order")
      if (data) {
        // Ensure we have the basic roles if DB is empty or different
        const roleNames = data.map(r => r.name)
        if (roleNames.length > 0) setAvailableRoles(roleNames)
      }
    }
    fetchRoles()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { user, profile } = await authService.login(email, password)
      setUser(profile)
      setGlobalUser(profile)

      // Check if user belongs to a group
      const userGroup = await authService.getUserGroup(user.id)

      if (userGroup) {
        const groupData = Array.isArray(userGroup) ? userGroup[0] : userGroup
        setGroup(groupData)
        setGlobalGroup(groupData)

        // Fetch Group Members
        const { data: memberData, error: memberError } = await supabase
          .from('group_members')
          .select(`
                user_id,
                role,
                users (
                    id,
                    name,
                    profile_image_url
                )
            `)
          .eq('group_id', groupData.id)

        if (memberData) {
          const initialMembers: SessionMember[] = memberData.map((m: any) => ({
            id: m.users.id,
            name: m.users.name,
            role: m.role || "영상", // Default role from DB or fallback
            profile_image_url: m.users.profile_image_url
          }))

          // Sort by role priority for display (Director first)
          // Simple sort: Director > Assistant > Video
          const rolePriority: Record<string, number> = { "감독": 1, "부감독": 2, "영상": 3 }
          initialMembers.sort((a, b) => (rolePriority[a.role] || 99) - (rolePriority[b.role] || 99))

          setSessionMembers(initialMembers)
        }

        setStep("session-setup")
      } else {
        // No group, go straight to dashboard
        router.push("/")
      }
    } catch (error: any) {
      toast.error("로그인 실패: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStartSession = async () => {
    if (!group || !user) return

    // Validation: Check for Director
    const hasDirector = sessionMembers.some(m => m.role === '감독')
    if (!hasDirector) {
      const confirmStart = confirm("감독이 지정되지 않았습니다. 그래도 근무를 시작하시겠습니까?")
      if (!confirmStart) return
    }

    setLoading(true)
    try {
      // 1. Create Work Session in DB
      const { data: sessionData, error: sessionError } = await supabase
        .from('work_sessions')
        .insert({
          group_id: group.id,
          date: new Date().toISOString().split('T')[0],
          start_time: new Date().toISOString(),
          status: 'active'
        })
        .select()
        .single()

      if (sessionError) throw sessionError

      // 2. Insert Session Members
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

      // 3. Update Global Store
      setGlobalSession({
        id: sessionData.id,
        groupId: group.id,
        groupName: group.name,
        members: sessionMembers,
        startedAt: sessionData.start_time
      })

      toast.success(`${group.name} 근무 세션이 시작되었습니다.`)
      router.push("/")
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

    // Search in both users and support_staff
    const { data: users } = await supabase
      .from('users')
      .select('id, name, role, profile_image_url')
      .ilike('name', `%${query}%`)
      .limit(5)

    const { data: staff } = await supabase
      .from('support_staff')
      .select('id, name, role') // support_staff doesn't have profile_image_url yet in types but let's handle it
      .ilike('name', `%${query}%`)
      .limit(5)

    const combined = [
      ...(users || []).map((u: any) => ({ ...u, type: 'internal' })),
      ...(staff || []).map((s: any) => ({ ...s, type: 'external', profile_image_url: null }))
    ]
    setSearchResults(combined)
  }

  const handleSelectWorker = (worker: any) => {
    if (searchMode === 'substitute' && targetMemberId) {
      // Substitute logic
      setSessionMembers(prev => prev.map(m => {
        if (m.id === targetMemberId) {
          return {
            id: worker.id,
            name: worker.name,
            role: m.role, // Keep original role
            isSubstitute: true,
            originalMemberId: m.id,
            profile_image_url: worker.profile_image_url
          }
        }
        return m
      }))
      toast.success(`${worker.name}님으로 교체되었습니다.`)
    } else {
      // Add logic
      if (sessionMembers.find(m => m.id === worker.id)) {
        toast.error("이미 목록에 있는 근무자입니다.")
        return
      }
      setSessionMembers(prev => [...prev, {
        id: worker.id,
        name: worker.name,
        role: '영상', // Default role
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

          {step === "login" ? (
            // Login Form
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2 text-center lg:text-left">
                <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">로그인</h2>
                <p className="text-slate-500 dark:text-slate-400">업무일지 시스템 접속을 위해 인증해주세요</p>
              </div>

              <div className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full h-12 rounded-xl border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-medium transition-all shadow-sm"
                  onClick={async () => {
                    try {
                      await authService.loginWithGoogle()
                    } catch (error: any) {
                      toast.error("Google 로그인 실패: " + error.message)
                    }
                  }}
                >
                  <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google 계정으로 로그인
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-100" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-400 font-medium">Or continue with email</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-600 font-medium pl-1">
                    사번 / 이메일
                  </Label>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <Input
                      id="email"
                      type="text"
                      placeholder="name@mbcplus.com"
                      className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all rounded-xl"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <Input
                      id="password"
                      type="password"
                      className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all rounded-xl"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end px-1">
                    <Link href="#" className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline">
                      비밀번호 찾기
                    </Link>
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 mt-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-lg hover:shadow-xl transition-all text-base"
                >
                  {loading ? "로그인 중..." : "로그인"}
                </Button>
              </form>

              <div className="flex flex-col space-y-4 mt-10 pt-6 border-t border-slate-100">
                <p className="text-center text-sm text-slate-500">
                  계정이 없으신가요?{" "}
                  <Link href="/signup" className="text-blue-600 font-semibold hover:underline">
                    계정 만들기
                  </Link>
                </p>
                <p className="text-center text-xs text-slate-400 font-light">Copyright © MBC PLUS. All rights reserved.</p>
              </div>
            </div>
          ) : (
            // Session Setup Form
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep("login")}
                  className="text-slate-500 hover:text-slate-900"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" /> 뒤로가기
                </Button>
                <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  {group?.name || "소속 없음"}
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
                              key={worker.id}
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
