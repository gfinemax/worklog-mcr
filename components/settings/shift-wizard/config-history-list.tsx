"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MoreHorizontal, MessageSquare, Plus } from "lucide-react"
import { format, isAfter, isBefore, isSameDay, parseISO } from "date-fns"
import { supabase } from "@/lib/supabase"

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"

interface ShiftConfig {
    id: string
    valid_from: string
    cycle_length: number
    memo?: string
    created_at: string
    created_by_user?: {
        name: string
    }
    pattern_json: any[]
}

import { useShiftWizardStore } from "@/store/shift-wizard-store"
import { Step3Confirm } from "./step-3-confirm"

export function ConfigHistoryList() {
    const router = useRouter()
    const [configs, setConfigs] = useState<ShiftConfig[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedConfig, setSelectedConfig] = useState<ShiftConfig | null>(null)
    const [teamMembers, setTeamMembers] = useState<Record<string, string[]>>({})

    const { isWizardActive, draftConfig, draftAssignments, updateDraftConfig, resetWizard, setStep } = useShiftWizardStore()

    const fetchTeamMembers = async () => {
        const { data: members } = await supabase
            .from('group_members')
            .select(`
                user:users(name),
                group:groups(name)
            `)
            .order('display_order', { ascending: true })

        if (members) {
            const teamMap: Record<string, string[]> = {}
            members.forEach((m: any) => {
                const groupName = m.group?.name
                const userName = m.user?.name
                if (groupName && userName) {
                    if (!teamMap[groupName]) teamMap[groupName] = []
                    teamMap[groupName].push(userName)
                }
            })
            setTeamMembers(teamMap)
        }
    }

    const fetchConfigs = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('shift_pattern_configs')
            .select(`
                *,
                created_by_user:users!created_by(name)
            `)
            .order('valid_from', { ascending: false })

        if (!error && data) {
            // @ts-ignore
            setConfigs(data)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchConfigs()
        fetchTeamMembers()
    }, [])

    // Wizard Mode Logic
    if (isWizardActive) {
        // Convert draftAssignments (array) to Record<team, userIds>
        const assignmentsRecord: Record<string, string[]> = {}
        const teams = draftConfig?.shift_teams || []
        teams.forEach(t => assignmentsRecord[t] = [])
        assignmentsRecord['Unassigned'] = []

        if (draftAssignments.length > 0) {
            draftAssignments.forEach(a => {
                if (!assignmentsRecord[a.team]) assignmentsRecord[a.team] = []
                assignmentsRecord[a.team].push(a.workerId)
            })
        }

        const step3Data = {
            id: draftConfig?.id,
            validFrom: draftConfig?.valid_from ? parseISO(draftConfig.valid_from) : new Date(),
            cycleLength: draftConfig?.shift_cycle_days || 4,
            pattern: draftConfig?.pattern_json || [],
            assignments: assignmentsRecord,
            memo: draftConfig?.description || ""
        }

        return (
            <div className="h-full">
                <Step3Confirm
                    data={step3Data}
                    onChange={(d) => updateDraftConfig({ description: d.memo })}
                    onBack={() => setStep(2)}
                    onComplete={() => {
                        resetWizard()
                        fetchConfigs() // Refresh list
                        router.push('/settings/worker-pattern?tab=history') // Stay on history tab but normal mode
                    }}
                />
            </div>
        )
    }

    const getStatus = (validFrom: string, index: number, allConfigs: ShiftConfig[]) => {
        const today = new Date()
        const startDate = parseISO(validFrom)

        if (isAfter(startDate, today) && !isSameDay(startDate, today)) {
            return 'pending'
        }

        const startedConfigs = allConfigs.filter(c =>
            isBefore(parseISO(c.valid_from), today) || isSameDay(parseISO(c.valid_from), today)
        )

        if (startedConfigs.length > 0 && startedConfigs[0].id === allConfigs[index].id) {
            return 'active'
        }

        return 'expired'
    }

    return (
        <>
            <Card className="h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-1">
                        <CardTitle className="text-base">설정 이력 (History)</CardTitle>
                        <CardDescription>
                            과거, 현재, 그리고 예정된 근무 패턴 목록입니다.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50 border-b text-xs font-medium text-muted-foreground">
                            <div className="col-span-1 text-center">상태</div>
                            <div className="col-span-2">기준일 (적용일)</div>
                            <div className="col-span-4">내용</div>
                            <div className="col-span-3">비고</div>
                            <div className="col-span-1">등록자</div>
                            <div className="col-span-1 text-right">관리</div>
                        </div>
                        <ScrollArea className="h-[600px]">
                            {configs.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground text-sm">
                                    기록된 설정이 없습니다.
                                </div>
                            ) : (
                                configs.map((config, index) => {
                                    const status = getStatus(config.valid_from, index, configs)
                                    return (
                                        <div
                                            key={config.id}
                                            className={`grid grid-cols-12 gap-4 p-4 items-center text-sm border-b last:border-0 hover:bg-slate-50 transition-colors cursor-pointer ${status === 'active' ? 'bg-blue-50/50' : ''}`}
                                            onClick={() => router.push(`/settings/worker-pattern/${config.id}`)}
                                        >
                                            <div className="col-span-1 flex justify-center">
                                                {status === 'active' && <Badge className="bg-green-600 hover:bg-green-700">적용중</Badge>}
                                                {status === 'pending' && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">대기</Badge>}
                                                {status === 'expired' && <Badge variant="outline" className="text-slate-400 border-slate-200">종료</Badge>}
                                            </div>
                                            <div className="col-span-2 font-medium">
                                                {format(parseISO(config.valid_from), 'yyyy.MM.dd')}
                                            </div>
                                            <div className="col-span-4">
                                                {config.cycle_length}일 주기
                                            </div>
                                            <div className="col-span-3 text-muted-foreground flex items-center gap-2">
                                                {config.memo ? (
                                                    <>
                                                        <MessageSquare className="h-3 w-3" />
                                                        <span className="truncate">{config.memo}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </div>
                                            <div className="col-span-1 text-xs text-muted-foreground">
                                                {config.created_by_user?.name || '-'}
                                            </div>
                                            <div className="col-span-1 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={(e) => {
                                                            e.stopPropagation()
                                                            router.push(`/settings/worker-pattern/${config.id}`)
                                                        }}>
                                                            상세보기
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={async (e) => {
                                                            e.stopPropagation()

                                                            // Load assignments based on current group members
                                                            const { data: users } = await supabase
                                                                .from('users')
                                                                .select('id, group_members(groups(name))')

                                                            const assignments: any[] = []
                                                            if (users) {
                                                                users.forEach((u: any) => {
                                                                    const groupName = u.group_members?.[0]?.groups?.name
                                                                    if (groupName && config.pattern_json.some((p: any) => p.A.team === groupName || p.N.team === groupName)) {
                                                                        assignments.push({
                                                                            workerId: u.id,
                                                                            team: groupName
                                                                        })
                                                                    } else {
                                                                        // Add to Unassigned if not in any of the active teams
                                                                        assignments.push({
                                                                            workerId: u.id,
                                                                            team: 'Unassigned'
                                                                        })
                                                                    }
                                                                })
                                                            }

                                                            const { startWizard } = useShiftWizardStore.getState()
                                                            startWizard({
                                                                config: {
                                                                    ...config,
                                                                    id: config.id, // Keep ID for update
                                                                    name: `Edit ${format(parseISO(config.valid_from), 'yyyy-MM-dd')}`, // Default name
                                                                    shift_cycle_days: config.cycle_length,
                                                                    shift_teams: Array.from(new Set(config.pattern_json.flatMap((p: any) => [p.A.team, p.N.team]))),
                                                                    shift_times: {
                                                                        day_start: '09:00',
                                                                        day_end: '18:00',
                                                                        night_start: '18:00',
                                                                        night_end: '09:00'
                                                                    },
                                                                    description: config.memo
                                                                },
                                                                assignments
                                                            })
                                                            router.push('/settings/worker-pattern?tab=pattern')
                                                        }}>
                                                            수정
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={async (e) => {
                                                            e.stopPropagation()

                                                            // Clone Logic
                                                            // 1. Fetch assignments if possible (or just config)
                                                            // For now, we clone the config structure. Assignments are harder to reconstruct perfectly from history without a snapshot.
                                                            // We will load current assignments as a baseline, similar to "Edit Current".

                                                            const { data: users } = await supabase
                                                                .from('users')
                                                                .select('id, group_members(groups(name))')

                                                            const assignments: any[] = []
                                                            if (users) {
                                                                users.forEach((u: any) => {
                                                                    const groupName = u.group_members?.[0]?.groups?.name
                                                                    if (groupName && config.pattern_json.some((p: any) => p.A.team === groupName || p.N.team === groupName)) {
                                                                        assignments.push({
                                                                            workerId: u.id,
                                                                            team: groupName
                                                                        })
                                                                    }
                                                                })
                                                            }

                                                            const { startWizard } = useShiftWizardStore.getState()
                                                            startWizard({
                                                                config: {
                                                                    ...config,
                                                                    id: undefined, // New ID
                                                                    name: `Copy of ${format(parseISO(config.valid_from), 'yyyy-MM-dd')}`, // Default name
                                                                    valid_from: undefined, // Reset date
                                                                    shift_cycle_days: config.cycle_length,
                                                                    shift_teams: Array.from(new Set(config.pattern_json.flatMap((p: any) => [p.A.team, p.N.team]))),
                                                                    shift_times: {
                                                                        day_start: '09:00',
                                                                        day_end: '18:00',
                                                                        night_start: '18:00',
                                                                        night_end: '09:00'
                                                                    },
                                                                    description: config.memo
                                                                },
                                                                assignments
                                                            })
                                                            router.push('/settings/worker-pattern?tab=pattern')
                                                        }}>
                                                            이 설정으로 새로 만들기
                                                        </DropdownMenuItem>
                                                        {(status === 'pending' || status === 'expired') && (
                                                            <>
                                                                <DropdownMenuItem
                                                                    className="text-red-600"
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation()
                                                                        if (confirm('정말 이 설정을 삭제하시겠습니까?')) {
                                                                            const { data: { user } } = await supabase.auth.getUser()
                                                                            console.log('Current user:', user)

                                                                            const { error, count } = await supabase
                                                                                .from('shift_pattern_configs')
                                                                                .delete({ count: 'exact' })
                                                                                .eq('id', config.id)

                                                                            if (error) {
                                                                                console.error('Delete error:', error)
                                                                                alert(`삭제 실패: ${error.message}`)
                                                                            } else if (count === 0) {
                                                                                alert('삭제된 항목이 없습니다. 권한이 없거나 이미 삭제되었을 수 있습니다.')
                                                                            } else {
                                                                                alert('삭제되었습니다.')
                                                                                fetchConfigs()
                                                                            }
                                                                        }
                                                                    }}
                                                                >
                                                                    삭제
                                                                </DropdownMenuItem>
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </ScrollArea>
                    </div>
                </CardContent>
            </Card>
        </>
    )
}
