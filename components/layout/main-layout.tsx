import type React from "react"
import { Sidebar } from "./sidebar"
import { Navbar } from "./navbar"

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="pl-64">
        <Navbar />
        <main className="pt-16">
          <div className="p-6 print:p-0">{children}</div>
        </main>
      </div>
    </div>
  )
}
