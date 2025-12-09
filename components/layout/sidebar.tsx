"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { LayoutDashboard, FileText, PenSquare, BarChart3, Settings, Users, Tv, Calendar, UserCircle, LogOut, ChevronLeft, ChevronRight, Menu } from "lucide-react"
import { useState, useEffect, Fragment } from "react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/auth"
import { GuestLoginDialog } from "@/components/auth/guest-login-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { LoginForm } from "@/components/auth/login-form"
import { useSidebar } from "./sidebar-context"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { SessionSetupStep } from "@/components/auth/session-setup-step"

const menuItems = [
  { icon: LayoutDashboard, label: "대시보드", href: "/" },
  { icon: Calendar, label: "오늘 업무일지", href: "/worklog?mode=today" },
  { icon: Tv, label: "오늘 중계현황", href: "/broadcasts" },
  { icon: FileText, label: "업무일지 목록", href: "/worklog", exact: true },

  { icon: PenSquare, label: "포스트 목록", href: "/posts" },
  { icon: Tv, label: "채널 관리", href: "/channels" },
  { icon: BarChart3, label: "통계 및 보고서", href: "/statistics" },
  { icon: Users, label: "근무패턴 설정", href: "/settings/worker-pattern" },
  { icon: Settings, label: "프로그램 설정", href: "/settings", exact: true },
]

export function Sidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const mode = searchParams.get('mode')
  const [guestLoginOpen, setGuestLoginOpen] = useState(false)
  const [handoverOpen, setHandoverOpen] = useState(false)
  const [handoverStep, setHandoverStep] = useState<'login' | 'setup'>('login')
  const [handoverData, setHandoverData] = useState<any>(null)
  const { user, guestSession, setNextUser, setNextSession } = useAuthStore()
  const { isCollapsed, toggleCollapse, isMobileOpen, closeMobile } = useSidebar()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleHandoverLoginSuccess = (data: any) => {
    setHandoverData(data)
    setHandoverStep('setup')
  }

  const handleHandoverComplete = (members: any[]) => {
    if (!handoverData) return

    const { profile, groupData } = handoverData
    setNextUser(profile)
    setNextSession({
      groupId: groupData.id,
      groupName: groupData.name,
      members: members,
      startedAt: new Date().toISOString()
    })

    toast.success(`${groupData.name} 교대 근무 로그인이 완료되었습니다.`)
    setHandoverOpen(false)
    // Reset state after a delay to allow dialog close animation
    setTimeout(() => {
      setHandoverStep('login')
      setHandoverData(null)
    }, 300)
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        "flex h-16 items-center border-b border-sidebar-border shrink-0 transition-all duration-300",
        isCollapsed && !isMobile ? "justify-center px-0" : "px-6"
      )}>
        <Link href="/" className="flex items-center gap-2" onClick={isMobile ? closeMobile : undefined}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary shrink-0">
            <span className="text-lg font-bold text-sidebar-primary-foreground">M</span>
          </div>
          <div className={cn(
            "flex flex-col transition-all duration-300 overflow-hidden whitespace-nowrap",
            isCollapsed && !isMobile ? "w-0 opacity-0" : "w-auto opacity-100"
          )}>
            <span className="text-sm font-bold text-sidebar-foreground">MBC플러스</span>
            <span className="text-xs text-sidebar-foreground/70">주조정실</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-hide">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon

            let isActive = false
            if (item.href === "/worklog?mode=today") {
              isActive = pathname === "/worklog" && mode === "today"
            } else if (item.href === "/worklog") {
              isActive = pathname === "/worklog" && !mode
            } else {
              // @ts-ignore
              isActive = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(item.href + "/")
            }

            const LinkContent = (
              <Link
                href={item.href}
                onClick={isMobile ? closeMobile : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                  isCollapsed && !isMobile ? "justify-center px-2" : "px-3"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className={cn(
                  "transition-all duration-300 overflow-hidden whitespace-nowrap",
                  isCollapsed && !isMobile ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
                )}>
                  {item.label}
                </span>
              </Link>
            )

            const showSeparator = item.href === "/settings/worker-pattern"

            if (isCollapsed && !isMobile) {
              return (
                <Fragment key={item.href}>
                  {showSeparator && (
                    <li className="my-4 px-2">
                      <div className="h-px bg-white/10" />
                    </li>
                  )}
                  <li>
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          {LinkContent}
                        </TooltipTrigger>
                        <TooltipContent side="right" className="flex items-center gap-2">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </li>
                </Fragment>
              )
            }

            return (
              <Fragment key={item.label + item.href}>
                {showSeparator && (
                  <li className="mt-6 mb-2 px-4">
                    <div className="flex items-center gap-3">
                      <div className="h-px w-3 bg-white/10" />
                      <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                        Settings
                      </span>
                      <div className="h-px flex-1 bg-white/10" />
                    </div>
                  </li>
                )}
                <li>
                  {LinkContent}
                </li>
              </Fragment>
            )
          })}
        </ul>
      </nav>

      {/* Auth & User Info */}
      <div className="border-t border-sidebar-border p-4 space-y-4 bg-sidebar/50">
        {/* Handover Button */}
        <Button
          variant="outline"
          className={cn(
            "w-full text-xs h-9 bg-white/50 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all",
            isCollapsed && !isMobile ? "justify-center px-0" : "justify-start gap-2"
          )}
          onClick={() => setHandoverOpen(true)}
        >
          <Users className="h-4 w-4 shrink-0" />
          <span className={cn(
            "transition-all duration-300 overflow-hidden whitespace-nowrap",
            isCollapsed && !isMobile ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
          )}>
            다음 근무자 로그인 (교대)
          </span>
        </Button>

        {/* Guest Login Button */}
        {!guestSession && (
          <Button
            variant="ghost"
            className={cn(
              "w-full text-xs h-8 text-slate-500 hover:text-slate-900",
              isCollapsed && !isMobile ? "justify-center px-0" : "justify-start gap-2"
            )}
            onClick={() => setGuestLoginOpen(true)}
          >
            <UserCircle className="h-4 w-4 shrink-0" />
            <span className={cn(
              "transition-all duration-300 overflow-hidden whitespace-nowrap",
              isCollapsed && !isMobile ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
            )}>
              게스트/관리자 로그인
            </span>
          </Button>
        )}

        {/* User Profile */}
        <div className={cn(
          "flex items-center pt-2 transition-all duration-300",
          isCollapsed && !isMobile ? "justify-center flex-col gap-2" : "gap-3"
        )}>
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
          <div className={cn(
            "flex-1 min-w-0 transition-all duration-300 overflow-hidden",
            isCollapsed && !isMobile ? "w-0 opacity-0 hidden" : "w-auto opacity-100"
          )}>
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
              className={cn(
                "h-8 w-8 text-slate-400 hover:text-red-600",
                isCollapsed && !isMobile ? "hidden" : "flex"
              )}
              onClick={() => setGuestLoginOpen(true)}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Collapse Toggle Button (Desktop Only) */}
      {!isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-background shadow-sm hover:bg-accent z-50 hidden lg:flex"
          onClick={toggleCollapse}
        >
          {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </Button>
      )}
    </div>
  )

  return (
    <>
      {/* ... (Sidebar and Sheet remains same) ... */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border hidden lg:flex flex-col transition-all duration-300 print:hidden",
          isCollapsed ? "w-16" : "w-60"
        )}
      >
        <SidebarContent />
      </aside>

      <Sheet open={isMobileOpen} onOpenChange={closeMobile}>
        <SheetContent side="left" className="p-0 w-64 bg-sidebar border-r border-sidebar-border">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      <GuestLoginDialog
        open={guestLoginOpen}
        onOpenChange={setGuestLoginOpen}
      />

      <Dialog open={handoverOpen} onOpenChange={(open) => {
        setHandoverOpen(open)
        if (!open) {
          // Reset on close
          setTimeout(() => {
            setHandoverStep('login')
            setHandoverData(null)
          }, 300)
        }
      }}>
        <DialogContent className="sm:max-w-[400px]">
          {handoverStep === 'login' ? (
            <>
              <DialogHeader>
                <DialogTitle>다음 근무자 로그인</DialogTitle>
                <DialogDescription>
                  현재 세션을 유지한 채 다음 근무조 로그인을 미리 진행합니다.
                </DialogDescription>
              </DialogHeader>
              <LoginForm mode="handover" onSuccess={handleHandoverLoginSuccess} />
            </>
          ) : (
            <SessionSetupStep
              groupName={handoverData?.groupData?.name || ""}
              initialMembers={handoverData?.initialMembers || []}
              onConfirm={handleHandoverComplete}
              onCancel={() => setHandoverStep('login')}
              confirmLabel="교대 근무자 확정"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
