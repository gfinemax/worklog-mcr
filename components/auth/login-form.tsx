"use client"

import { useState } from "react"
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

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
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

                    // --- SHIFT VALIDATION START ---
                    // 1. Get Current Session Info from Store (or passed props if needed, but store is safer)
                    // We need to know the CURRENT team and CURRENT shift type to calculate the NEXT one.
                    const currentSession = useAuthStore.getState().currentSession

                    if (!currentSession) {
                        setError("현재 근무 세션 정보를 찾을 수 없습니다.")
                        return
                    }

                    // Determine current shift type (Day/Night)
                    // We can infer this from the current time or the session start time.
                    // But a safer way is to check the current time against the shift boundaries.
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
                        // 3. Calculate Expected Next Team
                        const expectedNextTeam = shiftService.getNextTeam(currentSession.groupName, currentShiftType, config)

                        // 4. Validate
                        if (expectedNextTeam && expectedNextTeam !== groupData.name) {
                            setError(`다음 근무자가 아닙니다. 다음 근무자(조) 로그인을 할 수가 없습니다.\n이 공용PC가 아닌 다른 개인PC를 이용하세요.\n(예상: ${expectedNextTeam}, 입력: ${groupData.name})`)
                            return // Block Login
                        }
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
                    router.push("/")
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
                    사번 / 이메일
                </Label>
                <div className="relative group">
                    <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    <Input
                        id="email"
                        type="email"
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
