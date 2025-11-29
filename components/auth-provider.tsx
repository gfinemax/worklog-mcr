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
                // Fetch profile
                const { data: profile } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', session.user.id)
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
