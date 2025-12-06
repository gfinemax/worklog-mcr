import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"

interface DevLoginButtonsProps {
    onLogin: (email: string, pass: string) => void
    bypassShiftCheck: boolean
    setBypassShiftCheck: (val: boolean) => void
    mode: 'default' | 'handover'
}

export function DevLoginButtons({ onLogin, bypassShiftCheck, setBypassShiftCheck, mode }: DevLoginButtonsProps) {
    const [buttons, setButtons] = useState<{ label: string, email: string, type: 'current' | 'next' }[]>([])

    useEffect(() => {
        const calculateDevButtons = async () => {
            try {
                const { shiftService } = await import("@/lib/shift-rotation")
                const config = await shiftService.getConfig()
                if (!config) return

                const now = new Date()
                const { shiftType, date: logicalDate } = shiftService.getLogicalShiftInfo(now)

                // 1. Calculate Current Team
                const teams = shiftService.getTeamsForDate(logicalDate, config)

                if (!teams) return

                const currentTeamName = shiftType === 'day' ? teams.A : teams.N

                // 2. Calculate Next Team
                const nextTeamName = shiftService.getNextTeam(currentTeamName, shiftType, config)

                const newButtons: { label: string, email: string, type: 'current' | 'next' }[] = []

                // Helper to fetch director email
                const fetchDirectorEmail = async (groupName: string) => {
                    // Get group ID first
                    const { data: group } = await supabase.from('groups').select('id').eq('name', groupName).single()
                    if (!group) return null

                    // Fetch member with role containing '감독'
                    const { data: member } = await supabase
                        .from('group_members')
                        .select('users (email, name)')
                        .eq('group_id', group.id)
                        .like('role', '%감독%')
                        .limit(1)
                        .maybeSingle()

                    return member?.users ? (member.users as any) : null
                }

                if (currentTeamName) {
                    const director = await fetchDirectorEmail(currentTeamName)
                    if (director) {
                        newButtons.push({
                            label: `${currentTeamName}(현재) - ${director.name}`,
                            email: director.email,
                            type: 'current'
                        })
                    } else {
                        newButtons.push({
                            label: `${currentTeamName}(현재) - 감독없음`,
                            email: '',
                            type: 'current'
                        })
                    }
                }

                if (nextTeamName) {
                    const director = await fetchDirectorEmail(nextTeamName)
                    if (director) {
                        newButtons.push({
                            label: `${nextTeamName}(다음) - ${director.name}`,
                            email: director.email,
                            type: 'next'
                        })
                    } else {
                        newButtons.push({
                            label: `${nextTeamName}(다음) - 감독없음`,
                            email: '',
                            type: 'next'
                        })
                    }
                }

                setButtons(newButtons)
            } catch (e) {
                console.error('DevLogin: Error', e)
            }
        }

        calculateDevButtons()
    }, [])

    return (
        <div className="mt-6 p-4 border-2 border-dashed border-amber-300 rounded-xl bg-amber-50/50">
            <div className="text-xs font-bold text-amber-600 mb-2 uppercase tracking-wider">Development Mode</div>
            <div className="space-y-2">
                <div className="flex gap-2">
                    {buttons.map((btn, idx) => (
                        <Button
                            key={idx}
                            type="button"
                            variant="outline"
                            size="sm"
                            className={`flex-1 text-xs h-8 bg-white ${btn.type === 'current' ? 'border-blue-300 text-blue-700' : 'border-green-300 text-green-700'}`}
                            onClick={() => {
                                if (btn.email) {
                                    onLogin(btn.email, 'password1234')
                                }
                            }}
                            disabled={!btn.email}
                        >
                            {btn.label}
                        </Button>
                    ))}
                    {buttons.length === 0 && <span className="text-xs text-muted-foreground">근무 정보 로딩 중...</span>}
                </div>
                {mode === 'handover' && (
                    <div className="flex items-center gap-2 pt-1">
                        <input
                            type="checkbox"
                            id="bypassShift"
                            checked={bypassShiftCheck}
                            onChange={(e) => setBypassShiftCheck(e.target.checked)}
                            className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                        <label htmlFor="bypassShift" className="text-xs text-slate-600 cursor-pointer select-none">
                            근무 교대 검증 건너뛰기 (Shift Bypass)
                        </label>
                    </div>
                )}
            </div>
        </div>
    )
}
