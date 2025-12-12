"use client"
import { useShiftWizardStore } from "@/store/shift-wizard-store"
import { Step1Config } from "./step-1-config"
import { Button } from "@/components/ui/button"
import { PlusCircle, Settings, Loader2 } from "lucide-react"
import { parseISO, format } from "date-fns"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function WizardDashboard() {
    const { isWizardActive, draftConfig, startWizard, updateDraftConfig, setStep } = useShiftWizardStore()
    const [activeConfig, setActiveConfig] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchActiveConfig()
    }, [])

    const fetchActiveConfig = async () => {
        try {
            setLoading(true)
            const today = new Date().toISOString().split('T')[0]

            // Fetch the config that is active today (valid_from <= today)
            // We order by valid_from desc and take the first one
            const { data, error } = await supabase
                .from('shift_pattern_configs')
                .select('*')
                .lte('valid_from', today)
                .order('valid_from', { ascending: false })
                .limit(1)
                .single()

            if (data) {
                setActiveConfig(data)
            }
        } catch (error) {
            console.error("Error fetching active config:", error)
        } finally {
            setLoading(false)
        }
    }

    const handleEditCurrent = async () => {
        if (!activeConfig) return

        // We need to fetch current assignments for this pattern
        // Since we don't track historical assignments perfectly linked to config version yet,
        // we will fetch current group members and map them to the teams in the config.

        // 1. Fetch all users and their groups
        // 1. Fetch all users and their groups
        const { data: users } = await supabase
            .from('users')
            .select('id, group_members(groups(name), display_order)')

        const assignments: any[] = []
        if (users) {
            // Sort users by display_order if available
            const sortedUsers = [...users].sort((a: any, b: any) => {
                const orderA = a.group_members?.[0]?.display_order || 0
                const orderB = b.group_members?.[0]?.display_order || 0
                return orderA - orderB
            })

            sortedUsers.forEach((u: any) => {
                const groupName = u.group_members?.[0]?.groups?.name
                if (groupName && activeConfig.pattern_json.some((p: any) => p.A.team === groupName || p.N.team === groupName)) {
                    assignments.push({
                        workerId: u.id,
                        team: groupName
                    })
                }
            })
        }

        startWizard({
            config: {
                ...activeConfig,
                name: `Edit ${format(parseISO(activeConfig.valid_from), 'yyyy-MM-dd')}`,
                shift_cycle_days: activeConfig.cycle_length,
                shift_teams: Array.from(new Set(activeConfig.pattern_json.flatMap((p: any) => [p.A.team, p.N.team]))),
                shift_times: { // Default times if not in DB yet
                    day_start: '09:00',
                    day_end: '18:00',
                    night_start: '18:00',
                    night_end: '09:00'
                }
            },
            assignments
        })
    }

    if (!isWizardActive) {
        return (
            <div className="space-y-6">
                {/* Active Status Card */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    현재 운영 현황
                                    <Badge className="bg-green-600 hover:bg-green-700">운영중</Badge>
                                </CardTitle>
                                <CardDescription>현재 적용되어 운영 중인 근무 패턴 정보입니다.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : activeConfig ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">적용 시작일</p>
                                    <p className="font-bold text-lg">{format(parseISO(activeConfig.valid_from), 'yyyy년 MM월 dd일')}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">순환 주기</p>
                                    <p className="font-bold text-lg">{activeConfig.cycle_length}일 주기</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">운영 조</p>
                                    <p className="font-bold text-lg">
                                        {new Set(activeConfig.pattern_json.flatMap((p: any) => [p.A.team, p.N.team])).size}개 조
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4 text-muted-foreground">
                                현재 적용된 근무 패턴이 없습니다.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div
                        className="border rounded-lg p-6 hover:bg-muted transition-colors cursor-pointer flex flex-col items-center text-center space-y-3 group"
                        onClick={() => startWizard()}
                    >
                        <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                            <PlusCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">새 패턴 만들기</h3>
                            <p className="text-sm text-muted-foreground">처음부터 새로운 근무 형태를 설정합니다.</p>
                        </div>
                    </div>

                    <div
                        className="border rounded-lg p-6 hover:bg-muted transition-colors cursor-pointer flex flex-col items-center text-center space-y-3 group"
                        onClick={handleEditCurrent}
                    >
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-muted/80 transition-colors">
                            <Settings className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">현재 패턴 수정하기</h3>
                            <p className="text-sm text-muted-foreground">현재 설정을 불러와서 수정합니다.</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Map draftConfig to Step1Config data format
    const step1Data = {
        validFrom: draftConfig?.valid_from ? parseISO(draftConfig.valid_from) : undefined,
        cycleLength: draftConfig?.shift_cycle_days || 4,
        pattern: draftConfig?.pattern_json || []
    }

    const handleStep1Change = (data: any) => {
        updateDraftConfig({
            valid_from: data.validFrom ? data.validFrom.toISOString().split('T')[0] : undefined,
            shift_cycle_days: data.cycleLength,
            pattern_json: data.pattern
        })
    }

    return (
        <div className="h-full">
            <Step1Config
                data={step1Data}
                onChange={handleStep1Change}
                onNext={() => setStep(2)}
            />
        </div>
    )
}
