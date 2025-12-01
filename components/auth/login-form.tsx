"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Lock } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { authService } from "@/lib/auth"
import { useAuthStore, SessionMember } from "@/store/auth"
import { supabase } from "@/lib/supabase"

interface LoginFormProps {
    mode?: 'default' | 'handover'
    onSuccess?: () => void
}

export function LoginForm({ mode = 'default', onSuccess }: LoginFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const {
        setUser: setGlobalUser,
        setGroup: setGlobalGroup,
        setNextSession,
        setNextUser,
        setLoginMode
    } = useAuthStore()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { user, profile } = await authService.login(email, password)

            if (mode === 'default') {
                setGlobalUser(profile)
            }

            // Check if user belongs to a group
            const userGroup = await authService.getUserGroup(user.id)

            if (userGroup) {
                const groupData = Array.isArray(userGroup) ? userGroup[0] : userGroup

                if (mode === 'default') {
                    setGlobalGroup(groupData)
                    // For default login, we don't set session here anymore.
                    // Instead, the parent component (LoginPage) handles the flow based on group existence.
                    // But we need to pass this info up.
                    if (onSuccess) onSuccess()
                } else {
                    // Handover Mode
                    // 1. Fetch Group Members for the NEXT session
                    const { data: memberData } = await supabase
                        .from('group_members')
                        .select(`
                            user_id,
                            role,
                            users (
                                id,
                                name,
                                profile_image_url
                            )
                        `)
                        .eq('group_id', groupData.id)

                    let initialMembers: SessionMember[] = []
                    if (memberData) {
                        initialMembers = memberData.map((m: any) => ({
                            id: m.users.id,
                            name: m.users.name,
                            role: m.role || "영상",
                            profile_image_url: m.users.profile_image_url
                        }))
                        const rolePriority: Record<string, number> = { "감독": 1, "부감독": 2, "영상": 3 }
                        initialMembers.sort((a, b) => (rolePriority[a.role] || 99) - (rolePriority[b.role] || 99))
                    }

                    // 2. Set Next Session
                    setNextUser(profile)
                    setNextSession({
                        groupId: groupData.id,
                        groupName: groupData.name,
                        members: initialMembers,
                        startedAt: new Date().toISOString() // Temporary start time
                    })

                    toast.success(`${groupData.name} 교대 근무 로그인이 완료되었습니다.`)
                    if (onSuccess) onSuccess()
                }
            } else {
                // No group
                if (mode === 'default') {
                    setLoginMode('personal') // Default to personal if no group
                    router.push("/")
                } else {
                    toast.error("소속된 조가 없습니다.")
                }
            }
        } catch (error: any) {
            toast.error("로그인 실패: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-600 font-medium pl-1">
                    사번 / 이메일
                </Label>
                <div className="relative group">
                    <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <Input
                        id="email"
                        type="text"
                        placeholder="name@mbcplus.com"
                        className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all rounded-xl"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
            </div>
            <div className="space-y-2">
                <div className="relative group">
                    <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <Input
                        id="password"
                        type="password"
                        className="pl-10 h-11 bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all rounded-xl"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <div className="flex justify-end px-1">
                    <Link href="#" className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline">
                        비밀번호 찾기
                    </Link>
                </div>
            </div>
            <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-lg hover:shadow-xl transition-all text-base"
            >
                {loading ? "로그인 중..." : (mode === 'handover' ? "교대 근무 로그인" : "로그인")}
            </Button>
        </form>
    )
}
