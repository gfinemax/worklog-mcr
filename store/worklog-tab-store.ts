
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface WorklogTab {
    id: string
    title: string
    date: string
    type: string
}

interface WorklogTabState {
    tabs: WorklogTab[]
    activeTab: string
    addTab: (tab: WorklogTab) => void
    updateTab: (id: string, updates: Partial<WorklogTab>) => void
    removeTab: (id: string) => void
    setActiveTab: (id: string) => void
    closeAllTabs: () => void
}

export const useWorklogTabStore = create<WorklogTabState>()(
    persist(
        (set, get) => ({
            tabs: [],
            activeTab: 'list', // 'list' is the default tab

            addTab: (newTab) => {
                const { tabs } = get()

                // Check if tab already exists
                if (tabs.some(t => t.id === newTab.id)) {
                    set({ activeTab: newTab.id })
                    return
                }

                // Limit to 5 tabs (excluding list tab which is virtual)
                // If full, remove the oldest tab (first in array)
                let updatedTabs = [...tabs]
                if (updatedTabs.length >= 5) {
                    updatedTabs.shift()
                }

                set({
                    tabs: [...updatedTabs, newTab],
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

                // If closing active tab, switch to the nearest one or list
                let newActiveTab = activeTab
                if (activeTab === id) {
                    if (updatedTabs.length > 0) {
                        // Try to go to the right, else left
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
            name: 'worklog-tabs-storage',
        }
    )
)
