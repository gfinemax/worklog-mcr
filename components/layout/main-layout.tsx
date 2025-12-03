"use client"

import type React from "react"
import { Sidebar } from "./sidebar"
import { Navbar } from "./navbar"
import { SidebarProvider, useSidebar } from "./sidebar-context"
import { cn } from "@/lib/utils"

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className={cn(
        "transition-all duration-300 flex flex-col min-h-screen",
        "lg:pl-60", // Default desktop
        isCollapsed && "lg:pl-16" // Collapsed desktop
      )}>
        <Navbar />
        <main className="flex-1 pt-16">
          <div className="p-4 md:p-6 print:p-0 max-w-[1600px] mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  )
}
