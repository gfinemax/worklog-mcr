"use client"

import React, { Suspense } from "react"
import { Sidebar } from "./sidebar"
import { Navbar } from "./navbar"
import { SidebarProvider, useSidebar } from "./sidebar-context"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()
  const { user, guestSession } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    // Basic Client-side Protection
    // If not logged in and not a guest, redirect to login
    // We check this on mount.
    // Note: This relies on zustand persistence rehydrating quickly.
    // Ideally, we might wait for rehydration, but for now this prevents access.
    if (!user && !guestSession) {
      router.replace("/login")
    }
  }, [user, guestSession, router])

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<div className="fixed left-0 top-0 z-40 h-screen w-60 bg-sidebar border-r border-sidebar-border hidden lg:block" />}>
        <Sidebar />
      </Suspense>
      <div className={cn(
        "transition-all duration-300 flex flex-col min-h-screen",
        "lg:pl-60", // Default desktop
        isCollapsed && "lg:pl-16", // Collapsed desktop
        "print:pl-0" // Print mode
      )}>
        <Navbar />
        <main className="flex-1 pt-16 print:pt-0">
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
