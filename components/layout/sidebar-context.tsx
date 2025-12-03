"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

interface SidebarContextType {
    isCollapsed: boolean
    toggleCollapse: () => void
    isMobileOpen: boolean
    toggleMobile: () => void
    closeMobile: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [isCollapsed, setIsCollapsed] = useState(false)
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        const saved = localStorage.getItem("sidebar-collapsed")
        if (saved) {
            setIsCollapsed(JSON.parse(saved))
        }
    }, [])

    const toggleCollapse = () => {
        const newState = !isCollapsed
        setIsCollapsed(newState)
        localStorage.setItem("sidebar-collapsed", JSON.stringify(newState))
    }

    const toggleMobile = () => setIsMobileOpen(!isMobileOpen)
    const closeMobile = () => setIsMobileOpen(false)

    return (
        <SidebarContext.Provider
            value={{
                isCollapsed,
                toggleCollapse,
                isMobileOpen,
                toggleMobile,
                closeMobile,
            }}
        >
            {children}
        </SidebarContext.Provider>
    )
}

export function useSidebar() {
    const context = useContext(SidebarContext)
    if (context === undefined) {
        throw new Error("useSidebar must be used within a SidebarProvider")
    }
    return context
}
