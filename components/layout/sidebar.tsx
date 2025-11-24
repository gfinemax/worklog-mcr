"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, FileText, PenSquare, BarChart3, Settings, Users, Tv, CheckSquare, Calendar } from "lucide-react"

const menuItems = [
  { icon: LayoutDashboard, label: "대시보드", href: "/" },
  { icon: Calendar, label: "TODAY업무일지", href: "/worklog/today" },
  { icon: FileText, label: "업무일지목록", href: "/worklog" },

  { icon: PenSquare, label: "포스트", href: "/posts" },
  { icon: Tv, label: "채널 관리", href: "/channels" },
  { icon: CheckSquare, label: "업무확인 서명", href: "/signatures" },
  { icon: BarChart3, label: "통계 및 보고서", href: "/reports" },
  { icon: Users, label: "사용자 관리", href: "/users" },
  { icon: Settings, label: "설정", href: "/settings" },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-sidebar-border px-6">
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
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

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

        {/* User Info */}
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-primary">
              <span className="text-sm font-semibold text-sidebar-primary-foreground">관</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">관리자</p>
              <p className="text-xs text-sidebar-foreground/70 truncate">admin@mbcplus.com</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}
