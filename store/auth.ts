import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface User {
    id: string
    name: string
    role: string
    email?: string
    profile_image_url?: string
    type?: string
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

export type LoginMode = 'shift' | 'personal' | null

export interface CurrentSession {
    id?: string // work_session_id
    groupId: string
    groupName: string
    members: SessionMember[]
    startedAt: string
}

export type DeviceMode = 'shared' | 'personal'

export interface GuestSession {
    user: User
    expiresAt: number // timestamp
}

interface AuthStore {
    // Persisted State
    user: User | null
    group: Group | null
    loginMode: LoginMode
    currentSession: CurrentSession | null
    deviceMode: DeviceMode

    // Handover State (Persisted)
    nextSession: CurrentSession | null
    nextUser: User | null

    // Security Settings (Persisted)
    securitySettings: {
        requirePinForMemberSwitch: boolean
    }

    // Volatile State (Not Persisted)
    guestSession: GuestSession | null
    activeMemberId: string | null

    // Actions
    setUser: (user: User | null) => void
    setGroup: (group: Group | null) => void
    setLoginMode: (mode: LoginMode) => void
    setDeviceMode: (mode: DeviceMode) => void
    setSecuritySettings: (settings: Partial<{ requirePinForMemberSwitch: boolean }>) => void
    setActiveMemberId: (id: string | null) => void
    setSession: (session: CurrentSession | null) => void
    setNextSession: (session: CurrentSession | null) => void
    setNextUser: (user: User | null) => void
    setGuestSession: (session: GuestSession | null) => void
    promoteNextSession: () => void
    logout: () => void
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set) => ({
            user: null,
            group: null,
            loginMode: null,
            currentSession: null,
            deviceMode: 'personal', // Default to personal
            securitySettings: {
                requirePinForMemberSwitch: true // Default to true for security
            },
            nextSession: null,
            nextUser: null,
            guestSession: null,
            activeMemberId: null,

            setUser: (user) => set({ user }),
            setGroup: (group) => set({ group }),
            setLoginMode: (mode) => set({ loginMode: mode }),
            setDeviceMode: (mode) => set({ deviceMode: mode }),
            setSecuritySettings: (settings) => set((state) => ({
                securitySettings: { ...state.securitySettings, ...settings }
            })),
            setActiveMemberId: (id) => set({ activeMemberId: id }),
            setSession: (session) => set({ currentSession: session }),
            setNextSession: (session) => set({ nextSession: session }),
            setNextUser: (user) => set({ nextUser: user }),
            setGuestSession: (session) => set({ guestSession: session }),

            promoteNextSession: () => set((state) => ({
                user: state.nextUser || state.user,
                currentSession: state.nextSession,
                nextSession: null,
                nextUser: null
            })),

            logout: () => set({
                user: null,
                group: null,
                loginMode: null,
                activeMemberId: null,
                currentSession: null,
                nextSession: null,
                nextUser: null,
                guestSession: null
            }),
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => typeof window !== 'undefined' ? sessionStorage : {
                getItem: () => null,
                setItem: () => { },
                removeItem: () => { },
            }),
            partialize: (state) => ({
                user: state.user,
                group: state.group,
                loginMode: state.loginMode,
                currentSession: state.currentSession,
                deviceMode: state.deviceMode,
                securitySettings: state.securitySettings,
                nextSession: state.nextSession,
                nextUser: state.nextUser,
                activeMemberId: state.activeMemberId
            }),
        }
    )
)
