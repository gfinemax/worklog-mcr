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
import { useAuthStore } from "@/store/auth"

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<"login" | "session-setup">("login")
  const [loading, setLoading] = useState(false)

  const { setUser: setGlobalUser, setGroup: setGlobalGroup } = useAuthStore()

  // Login Form State
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // Session Setup State
  const [user, setUser] = useState<any>(null)
  const [group, setGroup] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([]) // All available members (default + external)
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])

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
        // Fetch default group members
        // For now, we'll simulate fetching members or use the authService if we added a method for it.
        // Since we didn't add a specific "getGroupMembers" to authService yet, let's assume we can get them.
        // Actually, let's just use the current user as the initial member for now, 
        // and in a real app we'd fetch the group's roster.
        // For this demo, let's assume the user is the first member.
        setMembers([profile])
        setSelectedMemberIds([profile.id])
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
    setLoading(true)
    try {
      await authService.startSession(group.id, user.id)
      // Also update with selected members if different from default
      if (selectedMemberIds.length > 0) {
        await authService.updateSessionMembers(group.id, selectedMemberIds)
      }
      toast.success(`${group.name} 근무 세션이 시작되었습니다.`)
      router.push("/")
    } catch (error: any) {
      toast.error("세션 시작 실패: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleMember = (memberId: string) => {
    setSelectedMemberIds(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  const handleSearchMember = async () => {
    if (!searchQuery.trim()) return
    try {
      const results = await authService.searchUsers(searchQuery)
      setSearchResults(results || [])
    } catch (error) {
      console.error(error)
    }
  }

  const addExternalMember = (member: any) => {
    if (!members.find(m => m.id === member.id)) {
      setMembers([...members, member])
    }
    if (!selectedMemberIds.includes(member.id)) {
      setSelectedMemberIds([...selectedMemberIds, member.id])
    }
    setSearchResults([])
    setSearchQuery("")
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
                      type="email"
                      placeholder="name@mbcplus.com"
                      className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all rounded-xl"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <Label htmlFor="password" className="text-slate-600 font-medium">
                      비밀번호
                    </Label>
                    <Link href="#" className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline">
                      비밀번호 찾기
                    </Link>
                  </div>
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
                <p className="text-slate-500 text-sm">오늘 함께 근무할 멤버를 선택해주세요.</p>
              </div>

              <div className="space-y-3">
                <Label className="text-slate-500 pl-1 text-xs uppercase tracking-wider font-semibold">
                  현재 멤버
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => toggleMember(member.id)}
                      className={cn(
                        "relative flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200",
                        selectedMemberIds.includes(member.id)
                          ? "border-blue-500 bg-blue-50/50 shadow-sm ring-1 ring-blue-200"
                          : "border-slate-100 bg-white hover:border-blue-200"
                      )}
                    >
                      <Avatar className="h-10 w-10 border border-slate-100">
                        <AvatarImage src={member.profile_image_url} />
                        <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">
                          {member.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-700">{member.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{member.role}</span>
                      </div>
                      {selectedMemberIds.includes(member.id) && (
                        <div className="absolute top-2 right-2 h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <Label className="text-slate-500 pl-1 text-xs uppercase tracking-wider font-semibold">
                  외부 지원 인력 추가
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="이름 검색..."
                    className="pl-9 pr-10 h-10 bg-slate-50 border-slate-200 focus:bg-white rounded-xl"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      handleSearchMember()
                    }}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery("")
                        setSearchResults([])
                      }}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {searchResults.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden max-h-40 overflow-y-auto">
                    {searchResults.map(result => (
                      <div
                        key={result.id}
                        onClick={() => addExternalMember(result)}
                        className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{result.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{result.name}</span>
                          <span className="text-xs text-slate-400">{result.role}</span>
                        </div>
                        <Plus className="ml-auto h-4 w-4 text-blue-500" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Button
                onClick={handleStartSession}
                disabled={loading || selectedMemberIds.length === 0}
                className="w-full h-12 mt-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all font-medium text-base"
              >
                {loading ? "세션 시작 중..." : "근무 시작하기"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
