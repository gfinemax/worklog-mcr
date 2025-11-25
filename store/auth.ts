import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
    id: string
    name: string
    role: string
    email?: string
    profile_image_url?: string
}

interface Group {
    id: string
    name: string
    active_members?: string[]
}

interface AuthStore {
    user: User | null
    group: Group | null
    setUser: (user: User | null) => void
    setGroup: (group: Group | null) => void
    logout: () => void
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            user: null,
            group: null,
            setUser: (user) => set({ user }),
            setGroup: (group) => set({ group }),
            logout: () => set({ user: null, group: null }),
        }),
        {
            name: 'auth-storage',
        }
    )
)
