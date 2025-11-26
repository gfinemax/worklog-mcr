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

export interface SessionMember {
    id: string // user_id
    name: string
    role: string // '감독' | '부감독' | '영상'
    isSubstitute?: boolean
    originalMemberId?: string
    profile_image_url?: string
}

export interface CurrentSession {
    id?: string // work_session_id
    groupId: string
    groupName: string
    members: SessionMember[]
    startedAt: string
}

interface AuthStore {
    user: User | null
    group: Group | null
    currentSession: CurrentSession | null
    setUser: (user: User | null) => void
    setGroup: (group: Group | null) => void
    setSession: (session: CurrentSession | null) => void
    logout: () => void
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            user: null,
            group: null,
            currentSession: null,
            setUser: (user) => set({ user }),
            setGroup: (group) => set({ group }),
            setSession: (session) => set({ currentSession: session }),
            logout: () => set({ user: null, group: null, currentSession: null }),
        }),
        {
            name: 'auth-storage',
        }
    )
)
