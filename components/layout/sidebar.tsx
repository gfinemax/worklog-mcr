"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, PenSquare, BarChart3, Settings, Users, Tv, CheckSquare, Calendar, RotateCcw, UserCircle, LogOut } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/auth"
import { GuestLoginDialog } from "@/components/auth/guest-login-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { LoginForm } from "@/components/auth/login-form"

const menuItems = [
  { icon: LayoutDashboard, label: "대시보드", href: "/" },
  { icon: Calendar, label: "오늘 업무일지", href: "/worklog/today" },
  { icon: Tv, label: "오늘 중계현황", href: "/broadcasts/today" },
  { icon: FileText, label: "업무일지 목록", href: "/worklog", exact: true },

  { icon: PenSquare, label: "포스트 목록", href: "/posts" },
  { icon: Tv, label: "채널 관리", href: "/channels" },
  { icon: CheckSquare, label: "업무확인 서명", href: "/signatures" },
  { icon: BarChart3, label: "통계 및 보고서", href: "/reports" },
  { icon: Users, label: "근무자 패턴 설정", href: "/settings/worker-pattern" },
  { icon: Settings, label: "프로그램 설정", href: "/settings", exact: true },
]

export function Sidebar() {
  const pathname = usePathname()
  const [guestLoginOpen, setGuestLoginOpen] = useState(false)
  const [handoverOpen, setHandoverOpen] = useState(false)
  const { user, guestSession, logout } = useAuthStore()

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-sidebar-border px-6 shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary">
              <span className="text-lg font-bold text-sidebar-primary-foreground">M</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-foreground">MBC플러스</span>
              <span className="text-xs text-sidebar-foreground/70">주조정실</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              // @ts-ignore
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(item.href + "/")

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Auth & User Info */}
        <div className="border-t border-sidebar-border p-4 space-y-4 bg-sidebar/50">
          {/* Handover Button */}
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-xs h-9 bg-white/50 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all"
            onClick={() => setHandoverOpen(true)}
          >
            <Users className="h-4 w-4" />
            다음 근무자 로그인 (교대)
          </Button>

          {/* Guest Login Button */}
          {!guestSession && (
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-xs h-8 text-slate-500 hover:text-slate-900"
              onClick={() => setGuestLoginOpen(true)}
            >
              <UserCircle className="h-4 w-4" />
              게스트/관리자 로그인
            </Button>
          )}

          {/* User Profile */}
          <div className="flex items-center gap-3 pt-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-primary shrink-0 overflow-hidden">
              {guestSession ? (
                <div className="h-full w-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                  {guestSession.user.name[0]}
                </div>
              ) : (
                <span className="text-sm font-semibold text-sidebar-primary-foreground">
                  {user?.name?.[0] || "U"}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {guestSession ? `${guestSession.user.name} (게스트)` : (user?.name || "사용자")}
              </p>
              <p className="text-xs text-sidebar-foreground/70 truncate">
                {guestSession ? "임시 로그인 중" : (user?.email || "")}
              </p>
            </div>
            {guestSession && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-red-600"
                onClick={() => setGuestLoginOpen(true)} // Re-open dialog to logout
              >
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </aside>

      <GuestLoginDialog
        open={guestLoginOpen}
        onOpenChange={setGuestLoginOpen}
      />

      <Dialog open={handoverOpen} onOpenChange={setHandoverOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>다음 근무자 로그인</DialogTitle>
            <DialogDescription>
              현재 세션을 유지한 채 다음 근무조 로그인을 미리 진행합니다.
            </DialogDescription>
          </DialogHeader>
          <LoginForm mode="handover" onSuccess={() => setHandoverOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  )
}
