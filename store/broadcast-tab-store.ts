import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface BroadcastTab {
    id: string           // 'list' | date string (e.g., '2025-12-08') | schedule id
    title: string
    date: string
}

interface BroadcastTabState {
    tabs: BroadcastTab[]
    activeTab: string
    addTab: (tab: BroadcastTab) => void
    updateTab: (id: string, updates: Partial<BroadcastTab>) => void
    removeTab: (id: string) => void
    setActiveTab: (id: string) => void
    closeAllTabs: () => void
}

export const useBroadcastTabStore = create<BroadcastTabState>()(
    persist(
        (set, get) => ({
            tabs: [],
            activeTab: 'list',

            addTab: (newTab) => {
                const { tabs } = get()

                // Check if tab already exists
                const existingIndex = tabs.findIndex(t => t.id === newTab.id)
                if (existingIndex !== -1) {
                    const updatedTabs = [...tabs]
                    updatedTabs[existingIndex] = { ...updatedTabs[existingIndex], ...newTab }
                    set({ tabs: updatedTabs, activeTab: newTab.id })
                    return
                }

                // Limit to 4 tabs (excluding list tab which is virtual)
                let updatedTabs = [...tabs]
                if (updatedTabs.length >= 4) {
                    updatedTabs.pop()
                }

                set({
                    tabs: [newTab, ...updatedTabs],
                    activeTab: newTab.id
                })
            },

            updateTab: (id, updates) => {
                const { tabs } = get()
                set({
                    tabs: tabs.map(t => t.id === id ? { ...t, ...updates } : t)
                })
            },

            removeTab: (id) => {
                const { tabs, activeTab } = get()
                const updatedTabs = tabs.filter(t => t.id !== id)

                let newActiveTab = activeTab
                if (activeTab === id) {
                    if (updatedTabs.length > 0) {
                        const index = tabs.findIndex(t => t.id === id)
                        const nextTab = updatedTabs[index] || updatedTabs[index - 1]
                        newActiveTab = nextTab ? nextTab.id : 'list'
                    } else {
                        newActiveTab = 'list'
                    }
                }

                set({
                    tabs: updatedTabs,
                    activeTab: newActiveTab
                })
            },

            setActiveTab: (id) => set({ activeTab: id }),

            closeAllTabs: () => set({ tabs: [], activeTab: 'list' })
        }),
        {
            name: 'broadcast-tabs-storage',
        }
    )
)
