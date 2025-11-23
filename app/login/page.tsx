"use client"

import type React from "react"

import { useState } from "react"
import { RobotMascot } from "@/components/characters/robot-mascot"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, Check, Users, User, Lock, LogIn, Info } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

// Mock data for team members
const TEAM_MEMBERS = [
  { id: 1, name: "김주조", role: "팀장", initial: "김" },
  { id: 2, name: "이영상", role: "팀원", initial: "이" },
  { id: 3, name: "박음향", role: "팀원", initial: "박" },
  { id: 4, name: "최서버", role: "팀원", initial: "최" },
  { id: 5, name: "정네트", role: "팀원", initial: "정" },
]

export default function LoginPage() {
  const router = useRouter()
  const [loginMode, setLoginMode] = useState<"team" | "individual">("team")
  const [teamStep, setTeamStep] = useState<"auth" | "select">("auth")
  const [selectedMember, setSelectedMember] = useState<number | null>(null)

  const handleTeamLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock team authentication
    setTeamStep("select")
  }

  const handleMemberLogin = () => {
    if (selectedMember) {
      // Mock member login completion
      router.push("/")
    }
  }

  const handleIndividualLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock individual login
    router.push("/")
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background">
      {/* Left Panel with Shader - Reorganized Layout */}
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

          {/* Decorative background glow */}
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

      {/* Right Panel with Login Form - Cleaner Layout */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white dark:bg-zinc-950">
        <div className="w-full max-w-[420px] space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">로그인</h2>
            <p className="text-slate-500 dark:text-slate-400">업무일지 시스템 접속을 위해 인증해주세요</p>
          </div>

          <Tabs defaultValue="team" className="w-full" onValueChange={(v) => setLoginMode(v as any)}>
            <TabsList className="grid w-full grid-cols-2 mb-8 h-auto p-1.5 bg-slate-100/80 dark:bg-slate-800/50 rounded-xl">
              <TabsTrigger
                value="team"
                className="rounded-lg py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>팀 로그인</span>
                </div>
              </TabsTrigger>
              <TabsTrigger
                value="individual"
                className="rounded-lg py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>개인 로그인</span>
                </div>
              </TabsTrigger>
            </TabsList>

            {/* Team Login Tab */}
            <TabsContent value="team" className="outline-none mt-0">
              {teamStep === "auth" ? (
                <form
                  onSubmit={handleTeamLogin}
                  className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500"
                >
                  <div className="space-y-2">
                    <Label htmlFor="team-id" className="text-slate-600 font-medium pl-1">
                      팀 아이디
                    </Label>
                    <div className="relative group">
                      <Users className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      <Input
                        id="team-id"
                        placeholder="예: MCR1"
                        className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all rounded-xl"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <Label htmlFor="team-pw" className="text-slate-600 font-medium">
                        팀 비밀번호
                      </Label>
                    </div>
                    <div className="relative group">
                      <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                      <Input
                        id="team-pw"
                        type="password"
                        className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all rounded-xl"
                        required
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 mt-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all font-medium text-base"
                  >
                    팀 접속하기
                  </Button>
                </form>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setTeamStep("auth")
                        setSelectedMember(null)
                      }}
                      className="text-slate-500 hover:text-slate-900"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" /> 뒤로가기
                    </Button>
                    <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">MCR 1팀</span>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-slate-500 pl-1 text-xs uppercase tracking-wider font-semibold">
                      근무자 선택
                    </Label>
                    <div className="grid grid-cols-3 gap-3">
                      {TEAM_MEMBERS.map((member) => (
                        <button
                          key={member.id}
                          onClick={() => setSelectedMember(member.id)}
                          className={cn(
                            "relative flex flex-col items-center p-3 rounded-2xl border transition-all duration-200 group",
                            selectedMember === member.id
                              ? "border-blue-500 bg-blue-50/50 shadow-md ring-1 ring-blue-200"
                              : "border-slate-100 bg-white hover:border-blue-200 hover:shadow-sm",
                          )}
                        >
                          <Avatar
                            className={cn(
                              "h-10 w-10 mb-2 transition-transform duration-200 group-hover:scale-105",
                              selectedMember === member.id ? "ring-2 ring-blue-200 ring-offset-2" : "",
                            )}
                          >
                            <AvatarImage src={`/placeholder-icon.png?height=48&width=48&text=${member.initial}`} />
                            <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">
                              {member.initial}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-semibold text-slate-700">{member.name}</span>
                          <span className="text-[10px] text-slate-400 font-medium bg-slate-50 px-1.5 py-0.5 rounded-md mt-1 border border-slate-100">
                            {member.role}
                          </span>

                          {selectedMember === member.id && (
                            <div className="absolute top-2 right-2 h-5 w-5 bg-blue-500 rounded-full flex items-center justify-center shadow-sm animate-in zoom-in duration-200">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedMember && (
                    <div className="space-y-4 pt-4 border-t border-dashed animate-in fade-in zoom-in-95 duration-200">
                      <div className="space-y-2">
                        <Label htmlFor="pin" className="text-slate-600 font-medium pl-1">
                          개인 PIN 번호 <span className="text-slate-400 font-normal text-xs ml-1">(선택사항)</span>
                        </Label>
                        <Input
                          id="pin"
                          type="password"
                          placeholder="••••"
                          className="text-center tracking-[0.5em] h-12 text-lg font-bold bg-slate-50 focus:bg-white rounded-xl"
                          maxLength={4}
                        />
                      </div>
                      <Button
                        onClick={handleMemberLogin}
                        className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all text-base"
                      >
                        <LogIn className="mr-2 h-4 w-4" />
                        로그인 완료
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Individual Login Tab */}
            <TabsContent value="individual" className="outline-none mt-0">
              <form
                onSubmit={handleIndividualLogin}
                className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-500"
              >
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-600 font-medium pl-1">
                    사번 / 이메일
                  </Label>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <Input
                      id="email"
                      placeholder="name@mbcplus.com"
                      className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all rounded-xl"
                      required
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
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 mt-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-lg hover:shadow-xl transition-all text-base"
                >
                  로그인
                </Button>
              </form>
            </TabsContent>
          </Tabs>

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
      </div>
    </div>
  )
}
