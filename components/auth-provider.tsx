'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { useRouter } from 'next/navigation'
import { AuthChangeEvent, Session } from '@supabase/supabase-js'

export default function AuthProvider({
    children,
}: {
    children: React.ReactNode
}) {
    const { setUser, logout } = useAuthStore()
    const router = useRouter()

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
            if (event === 'SIGNED_IN' && session?.user) {
                // Check if we have a persisted activeMemberId (Writer Switch)
                const { activeMemberId, currentSession, setActiveMemberId } = useAuthStore.getState()
                let targetUserId = session.user.id

                // Validate activeMemberId against current session members
                if (activeMemberId && currentSession?.members) {
                    const isValidMember = currentSession.members.some(m => m.id === activeMemberId)
                    if (isValidMember) {
                        console.log(`[AuthProvider] Restoring writer switch to: ${activeMemberId}`)
                        targetUserId = activeMemberId
                    } else {
                        console.warn(`[AuthProvider] Invalid activeMemberId: ${activeMemberId}, resetting to session user`)
                        setActiveMemberId(null)
                    }
                }

                // Fetch profile for targetUserId (either switched user or session user)
                const { data: profile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', targetUserId)
                    .single()

                if (profile) {
                    setUser(profile)
                }
            } else if (event === 'SIGNED_OUT') {
                logout()
                router.push('/login')
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [setUser, logout, router])

    return <>{children}</>
}
