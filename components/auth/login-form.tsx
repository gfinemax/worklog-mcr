"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { User, Lock, AlertCircle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { authService } from "@/lib/auth"
import { useAuthStore, SessionMember } from "@/store/auth"
import { supabase } from "@/lib/supabase"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DevLoginButtons } from "./dev-login-buttons"

interface LoginFormProps {
    mode?: 'default' | 'handover'
    onSuccess?: (data?: any) => void
}

export function LoginForm({ mode = 'default', onSuccess }: LoginFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState<string | null>(null)
    const [autoLogDialogOpen, setAutoLogDialogOpen] = useState(false)
    const [pendingLoginData, setPendingLoginData] = useState<any>(null)

    const {
        setUser: setGlobalUser,
        setGroup: setGlobalGroup,
        setNextSession,
        setNextUser,
        setLoginMode
    } = useAuthStore()

    const finalizeHandoverLogin = async (profile: any, groupData: any) => {
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
                role: (m.role || "영상").split(',')[0].trim(), // Parse primary role
                profile_image_url: m.users.profile_image_url
            }))
            const rolePriority: Record<string, number> = { "감독": 1, "부감독": 2, "영상": 3 }
            initialMembers.sort((a, b) => (rolePriority[a.role] || 99) - (rolePriority[b.role] || 99))
        }

        // Pass data to parent instead of setting session immediately
        if (onSuccess) onSuccess({ profile, groupData, initialMembers })
    }

    const handleAutoLogResponse = async (shouldDelete: boolean) => {
        if (!pendingLoginData) return
        const { profile, groupData, autoLogId } = pendingLoginData

        try {
            if (shouldDelete && autoLogId) {
                const { error } = await supabase.from('worklogs').delete().eq('id', autoLogId)
                if (error) throw error
                toast.success("자동 생성된 일지를 삭제했습니다.")
            } else {
                toast.info("기존 일지를 이어서 작성합니다.")
            }
            await finalizeHandoverLogin(profile, groupData)
        } catch (e: any) {
            toast.error("일지 처리 중 오류가 발생했습니다: " + e.message)
        } finally {
            setAutoLogDialogOpen(false)
            setPendingLoginData(null)
        }
    }

    // --- DEV HELPERS ---
    const [bypassShiftCheck, setBypassShiftCheck] = useState(false)
    const [isDev, setIsDev] = useState(false)

    useEffect(() => {
        setIsDev(process.env.NODE_ENV === 'development')
    }, [])

    const handleDevLogin = (devEmail: string, devPassword: string) => {
        setEmail(devEmail)
        setPassword(devPassword)
        // toast.info("테스트 계정 정보가 입력되었습니다. 로그인을 클릭하세요.")
    }
    // -------------------

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            // [NEW] Normalize email: Append domain if missing
            let normalizedEmail = email.trim()
            if (!normalizedEmail.includes('@')) {
                normalizedEmail += '@mbcplus.com'
            }

            const { user, profile } = await authService.login(normalizedEmail, password)

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

                    // --- SHIFT VALIDATION START ---
                    // 1. Get Current Session Info from Store
                    const currentSession = useAuthStore.getState().currentSession

                    if (!currentSession) {
                        setError("현재 근무 세션 정보를 찾을 수 없습니다.")
                        return
                    }

                    // Only perform validation if NOT bypassing
                    if (!bypassShiftCheck) {
                        // Determine current shift type (Day/Night)
                        const now = new Date()
                        const hours = now.getHours()
                        const minutes = now.getMinutes()
                        const timeInMinutes = hours * 60 + minutes
                        const dayStart = 7 * 60 + 30 // 07:30
                        const dayEnd = 18 * 60 + 30 // 18:30
                        const isDayShift = timeInMinutes >= dayStart && timeInMinutes < dayEnd
                        const currentShiftType = isDayShift ? 'day' : 'night'

                        // 2. Fetch Active Shift Config
                        const { shiftService } = await import("@/lib/shift-rotation")
                        const config = await shiftService.getConfig()

                        if (config) {
                            // 3. Calculate Expected Current & Next Team
                            // We need to check if the logging-in user is EITHER the Current Worker (re-login) OR Next Worker (handover)
                            // Actually, for Handover Mode, it usually implies switching to the NEXT worker.
                            // But if the Current Worker tries to login again in Handover mode, should we allow?
                            // The user said: "현재 근무자가 아닌 상태에서 조별 모드로그인을 하려고 하면 할 수 없다고 메시지를 해주고, 단 다음 교대 근무자일 경우는 다음 교대 근무자로 로그인 처리를 해주면 돼"
                            // This implies: Only Current Worker OR Next Worker can login.
                            // If I am Team A (Current), I can login.
                            // If I am Team B (Next), I can login.
                            // If I am Team C (Random), I CANNOT login.

                            const currentWorkerTeam = currentSession.groupName
                            const expectedNextTeam = shiftService.getNextTeam(currentWorkerTeam, currentShiftType, config)

                            // Also check if the logging-in group IS the current worker (re-authentication)
                            const isCurrentWorker = groupData.name === currentWorkerTeam
                            const isNextWorker = expectedNextTeam && expectedNextTeam === groupData.name

                            if (!isCurrentWorker && !isNextWorker) {
                                setError(`현재 근무자 또는 다음 교대 근무자가 아닙니다.\n로그인을 할 수 없습니다.\n(현재: ${currentWorkerTeam}, 다음: ${expectedNextTeam || '없음'})`)
                                return // Block Login
                            }
                        }
                    } else {
                        toast.warning("개발자 모드: 근무 교대 검증을 건너뛰었습니다.")
                    }
                    // --- SHIFT VALIDATION END ---

                    // --- AUTO-LOG CHECK START ---
                    // Check if there is an auto-created worklog for this group that is still pending
                    const { data: autoLog } = await supabase
                        .from('worklogs')
                        .select('id')
                        .eq('group_id', groupData.id)
                        .eq('is_auto_created', true)
                        .eq('status', '작성중')
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .single()

                    if (autoLog) {
                        setPendingLoginData({ profile, groupData, autoLogId: autoLog.id })
                        setAutoLogDialogOpen(true)
                        setLoading(false) // Stop loading spinner while waiting for user
                        return
                    }
                    // --- AUTO-LOG CHECK END ---

                    await finalizeHandoverLogin(profile, groupData)
                }
            } else {
                // No group
                if (mode === 'default') {
                    setLoginMode('personal') // Default to personal if no group
                    router.push("/dashboard")
                } else {
                    setError("소속된 조가 없습니다.")
                }
            }
        } catch (error: any) {
            setError("로그인 실패: " + error.message)
        } finally {
            // Only stop loading if we are NOT waiting for dialog
            // But we set loading=false inside the if(autoLog) block, so this is fine?
            // Wait, if autoLog is found, we return. Finally block runs.
            // So we need to make sure loading state is correct.
            // If we return, finally runs. So loading becomes false.
            // That's correct, we want the spinner to stop so user can interact with dialog.
            // But if we proceed to finalize, we want it to stay true?
            // finalizeHandoverLogin is async.
            // If we await it, finally runs after it finishes.
            // So loading stays true until finalize finishes. Correct.
            // If autoLog found, we return. Finally runs. Loading false. Correct.
            if (!pendingLoginData) { // This check might be stale because state updates are async
                // Actually, setPendingLoginData is async.
                // Better to rely on the fact that if we return, we are done with THIS function call.
                setLoading(false)
            }
        }
    }

    return (
        <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-600 font-medium pl-1">
                    아이디/이메일
                </Label>
                <div className="relative group">
                    <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <Input
                        id="email"
                        type="text"
                        placeholder="아이디 또는 name@mbcplus.com"
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
                        onChange={(e) => {
                            setPassword(e.target.value)
                            setError(null) // Clear error on input change
                        }}
                    />
                </div>
                <div className="flex justify-end px-1">
                    <Link href="#" className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline">
                        비밀번호 찾기
                    </Link>
                </div>
            </div>

            {error && (
                <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-1 duration-300">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>로그인 실패</AlertTitle>
                    <AlertDescription className="text-xs mt-1 leading-relaxed whitespace-pre-wrap">
                        {error}
                    </AlertDescription>
                </Alert>
            )}

            <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-lg hover:shadow-xl transition-all text-base"
            >
                {loading ? "로그인 중..." : (mode === 'handover' ? "교대 근무 로그인" : "로그인")}
            </Button>

            {/* DEV ONLY: Quick Login Helpers */}
            {isDev && (
                <DevLoginButtons onLogin={handleDevLogin} bypassShiftCheck={bypassShiftCheck} setBypassShiftCheck={setBypassShiftCheck} mode={mode} />
            )}

            <AlertDialog open={autoLogDialogOpen} onOpenChange={setAutoLogDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>자동 생성된 업무일지 발견</AlertDialogTitle>
                        <AlertDialogDescription>
                            시스템에 의해 자동 생성된 업무일지가 있습니다.<br />
                            기존 일지를 삭제하고 새로 작성하시겠습니까?<br />
                            (취소 시 자동 생성된 일지를 이어서 작성합니다.)
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => handleAutoLogResponse(false)}>이어서 작성</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleAutoLogResponse(true)} className="bg-red-600 hover:bg-red-700">삭제 후 새로 작성</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </form>
    )
}
