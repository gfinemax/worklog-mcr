
"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authService } from "@/lib/auth"
import { useAuthStore } from "@/store/auth"
import { toast } from "sonner"
import { Loader2, UserCircle, LogOut } from "lucide-react"

interface GuestLoginDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function GuestLoginDialog({ open, onOpenChange }: GuestLoginDialogProps) {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const { setGuestSession, guestSession } = useAuthStore()

    // Auto-logout timer
    useEffect(() => {
        let timer: NodeJS.Timeout
        if (guestSession) {
            const timeLeft = guestSession.expiresAt - Date.now()
            if (timeLeft <= 0) {
                handleLogout()
            } else {
                timer = setTimeout(() => {
                    handleLogout()
                    toast.info("게스트 세션이 만료되었습니다.")
                }, timeLeft)
            }
        }
        return () => clearTimeout(timer)
    }, [guestSession])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            // [NEW] Normalize email: Append domain if missing
            let normalizedEmail = email.trim()
            if (!normalizedEmail.includes('@')) {
                normalizedEmail += '@mbcplus.com'
            }

            const { profile } = await authService.login(normalizedEmail, password)

            // [NEW] Check if user is "Support Team" (Admin-like)
            // If so, do a FULL login instead of Guest login
            const userGroup: any = await authService.getUserGroup(profile.id)
            // Handle both array (if implied) and object returns
            const groupName = Array.isArray(userGroup) ? userGroup[0]?.name : userGroup?.name
            const isSupport = profile.type === 'support' || (groupName === '관리팀')

            if (isSupport) {
                // Full Login Logic
                const { setUser, setGroup, setLoginMode, setDeviceMode } = useAuthStore.getState()
                setUser(profile)
                setGroup(userGroup)
                setLoginMode('personal') // or 'shift' - 'personal' seems safer for individual login
                setDeviceMode('personal')

                toast.success(`${profile.name}님 (관리팀), 정식 로그인되었습니다.`)
            } else {
                // Guest Login Logic (Restricted)
                setGuestSession({
                    user: profile,
                    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
                })
                toast.success(`${profile.name}님, 게스트로 로그인되었습니다.`)
            }

            onOpenChange(false)
            setEmail("")
            setPassword("")
        } catch (error: any) {
            toast.error("로그인 실패: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleLogout = () => {
        setGuestSession(null)
        onOpenChange(false)
    }

    // If already logged in as guest, show status/logout
    if (guestSession) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>게스트 로그인 상태</DialogTitle>
                        <DialogDescription>
                            현재 {guestSession.user.name}님으로 임시 로그인 중입니다.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                {guestSession.user.name[0]}
                            </div>
                            <div>
                                <p className="font-bold text-slate-900">{guestSession.user.name}</p>
                                <p className="text-xs text-slate-500">{guestSession.user.email}</p>
                            </div>
                        </div>
                        <Button variant="destructive" onClick={handleLogout} className="w-full">
                            <LogOut className="mr-2 h-4 w-4" /> 게스트 로그아웃
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserCircle className="h-5 w-5 text-blue-500" />
                        게스트 로그인
                    </DialogTitle>
                    <DialogDescription>
                        잠깐 작업을 위해 임시로 로그인합니다.<br />
                        5분 후 자동으로 로그아웃됩니다.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleLogin} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="guest-email">사번 / 이메일</Label>
                        <Input
                            id="guest-email"
                            type="text"
                            placeholder="아이디 또는 name@mbcplus.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="guest-password">비밀번호</Label>
                        <Input
                            id="guest-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "로그인"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}
