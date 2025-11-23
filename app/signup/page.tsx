"use client"

import type React from "react"

import { RobotMascot } from "@/components/characters/robot-mascot"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Info, User, Mail, Lock, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function SignupPage() {
  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle signup logic
  }

  const handleGoogleSignup = () => {
    // Handle Google signup
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background">
      {/* Left Panel with Shader - Consistent with Login */}
      <div className="lg:w-1/2 relative bg-[#0f172a] flex flex-col overflow-hidden">
        <div className="relative z-20 p-8 lg:p-12 flex flex-col items-start">
          <Link href="/login" className="flex items-center gap-3 mb-6 group">
            <div className="h-10 w-10 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 shadow-lg group-hover:bg-white/20 transition-colors">
              <span className="text-xl font-bold text-white">M</span>
            </div>
            <span className="text-white/90 font-medium tracking-wider text-sm">MBC PLUS MCR</span>
          </Link>

          <div className="space-y-2 max-w-md">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
              새로운 계정으로
              <br />
              <span className="text-blue-400">스마트 워크스페이스</span> 시작하기
            </h1>
            <p className="text-blue-200/80 text-base lg:text-lg font-light">
              팀원들과 함께 효율적인 업무 관리를 경험해보세요.
            </p>
          </div>
        </div>

        <div className="flex-1 relative flex items-center justify-center w-full min-h-[300px]">
          <div className="relative z-10 scale-110 lg:scale-125 opacity-80">
            <RobotMascot />
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/20 blur-[100px] rounded-full pointer-events-none" />
        </div>

        <div className="relative z-20 p-8 lg:p-12">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-5">
            <div className="flex items-center gap-2 text-blue-300 mb-3">
              <Info className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Join Benefit</span>
            </div>
            <p className="text-sm text-blue-100/80">
              신규 가입 시 주조정실 업무 매뉴얼과 팀원 간 실시간 소통 기능을 즉시 이용하실 수 있습니다.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel with Signup Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white dark:bg-zinc-950">
        <div className="w-full max-w-[480px] space-y-8">
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">계정 만들기</h2>
            <p className="text-slate-500 dark:text-slate-400">MBC PLUS 주조정실 디지털 업무일지 시스템</p>
          </div>

          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-medium transition-all shadow-sm"
              onClick={handleGoogleSignup}
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
              Google 계정으로 시작하기
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

          <form onSubmit={handleSignup} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-600 font-medium pl-1">
                이름
              </Label>
              <div className="relative group">
                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                <Input
                  id="name"
                  placeholder="홍길동"
                  className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-600 font-medium pl-1">
                이메일
              </Label>
              <div className="relative group">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@mbcplus.com"
                  className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-600 font-medium pl-1">
                비밀번호
              </Label>
              <div className="relative group">
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                <Input
                  id="password"
                  type="password"
                  placeholder="8자 이상 입력해주세요"
                  className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all rounded-xl"
                  required
                />
              </div>
            </div>

            <div className="flex items-start space-x-2 pt-2">
              <Checkbox id="terms" className="mt-1" />
              <Label htmlFor="terms" className="text-sm text-slate-500 leading-tight font-normal">
                <Link href="#" className="text-blue-600 hover:underline font-medium">
                  서비스 이용약관
                </Link>{" "}
                및{" "}
                <Link href="#" className="text-blue-600 hover:underline font-medium">
                  개인정보 처리방침
                </Link>
                에 동의합니다.
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full h-12 mt-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all font-medium text-base group"
            >
              계정 만들기
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </form>

          <div className="pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="text-blue-600 font-semibold hover:underline">
                로그인하기
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
