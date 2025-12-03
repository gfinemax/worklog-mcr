"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, User, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface Worker {
    id: string
    name: string
    role: string
    current_team?: string
}

const ROLE_PRIORITY: Record<string, number> = {
    "감독": 1,
    "부감독": 2,
    "영상": 3,
    "시스템관리": 4,
    "관리": 5,
    "기술스텝": 6,
    "조원": 7
}

const getRolePriorityValue = (roleString: string) => {
    if (!roleString) return 99
    const priorities = roleString.split(',').map(r => ROLE_PRIORITY[r.trim()] || 99)
    return Math.min(...priorities)
}

export function LiveRosterView() {
    const [workers, setWorkers] = useState<Worker[]>([])
    const [loading, setLoading] = useState(true)
    const [teams, setTeams] = useState<string[]>([])
    const [assignments, setAssignments] = useState<Record<string, string[]>>({})

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            // 1. Fetch Active Config to get Teams
            const today = new Date().toISOString().split('T')[0]
            const { data: config } = await supabase
                .from('shift_pattern_configs')
                .select('pattern_json')
                .lte('valid_from', today)
                .order('valid_from', { ascending: false })
                .limit(1)
                .single()

            const activeTeams = new Set<string>()
            if (config) {
                config.pattern_json.forEach((p: any) => {
                    if (p.A.team) activeTeams.add(p.A.team)
                    if (p.N.team) activeTeams.add(p.N.team)
                })
            }
            // Default teams if no config
            if (activeTeams.size === 0) {
                ['1조', '2조', '3조', '4조'].forEach(t => activeTeams.add(t))
            }
            const sortedTeams = Array.from(activeTeams).sort()
            setTeams(sortedTeams)

            // 2. Fetch Users and Groups with Display Order
            const { data: users } = await supabase
                .from('users')
                .select(`
                    id, name, role,
                    group_members(groups(id, name), display_order)
                `)
                .eq('is_active', true)
                .order('name')

            if (users) {
                const formattedWorkers = users.map((u: any) => ({
                    id: u.id,
                    name: u.name,
                    role: u.role,
                    current_team: u.group_members?.[0]?.groups?.name || 'Unassigned',
                    display_order: u.group_members?.[0]?.display_order ?? 999
                }))

                // Sort by Display Order -> Role Priority -> Name
                formattedWorkers.sort((a, b) => {
                    // 1. Display Order (if valid)
                    if (a.display_order !== 999 || b.display_order !== 999) {
                        return a.display_order - b.display_order
                    }
                    // 2. Role Priority
                    const priorityA = getRolePriorityValue(a.role)
                    const priorityB = getRolePriorityValue(b.role)
                    if (priorityA !== priorityB) return priorityA - priorityB
                    // 3. Name
                    return a.name.localeCompare(b.name)
                })

                setWorkers(formattedWorkers)

                // Group by team
                const newAssignments: Record<string, string[]> = {}
                sortedTeams.forEach(t => newAssignments[t] = [])
                newAssignments['Unassigned'] = []

                formattedWorkers.forEach(w => {
                    if (sortedTeams.includes(w.current_team || '')) {
                        newAssignments[w.current_team!].push(w.id)
                    } else {
                        newAssignments['Unassigned'].push(w.id)
                    }
                })
                setAssignments(newAssignments)
            }
        } catch (error) {
            console.error(error)
            toast.error("데이터를 불러오는데 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    const moveWorker = async (workerId: string, targetTeamName: string) => {
        // Optimistic Update
        const worker = workers.find(w => w.id === workerId)
        if (!worker) return
        const previousTeam = worker.current_team || 'Unassigned'

        // Update Local State
        const newAssignments = { ...assignments }
        newAssignments[previousTeam] = newAssignments[previousTeam].filter(id => id !== workerId)
        if (!newAssignments[targetTeamName]) newAssignments[targetTeamName] = []
        newAssignments[targetTeamName].push(workerId)
        setAssignments(newAssignments)

        // Update Worker State
        setWorkers(prev => prev.map(w => w.id === workerId ? { ...w, current_team: targetTeamName } : w))

        try {
            // DB Update
            // 1. Get Group ID for target team
            let groupId = null
            if (targetTeamName !== 'Unassigned') {
                const { data: group } = await supabase.from('groups').select('id').eq('name', targetTeamName).single()
                if (group) groupId = group.id
            }

            if (groupId) {
                // Upsert group_members
                // First check if exists
                const { data: existing } = await supabase.from('group_members').select('id').eq('user_id', workerId).single()

                if (existing) {
                    await supabase.from('group_members').update({ group_id: groupId }).eq('user_id', workerId)
                } else {
                    await supabase.from('group_members').insert({ group_id: groupId, user_id: workerId })
                }
            } else {
                // Unassigned -> Remove from group_members
                await supabase.from('group_members').delete().eq('user_id', workerId)
            }

            toast.success(`${worker.name}님을 ${targetTeamName}(으)로 이동했습니다.`)
        } catch (error) {
            console.error(error)
            toast.error("이동 실패. 새로고침 해주세요.")
            fetchData() // Revert on error
        }
    }

    const getWorkerById = (id: string) => workers.find(w => w.id === id)

    if (loading) {
        return <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
    }

    return (
        <div className="h-full flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-bold">실시간 조 편성 (Live Roster)</h3>
                    <p className="text-sm text-muted-foreground">
                        현재 운영 중인 조 편성을 실시간으로 수정합니다. 이동 즉시 반영됩니다.
                    </p>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
                {/* Source: Unassigned */}
                <Card className="col-span-3 flex flex-col h-full border-slate-200 bg-slate-50/50">
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm flex justify-between">
                            미배정
                            <Badge variant="secondary">{assignments['Unassigned']?.length || 0}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-2">
                        <ScrollArea className="h-full pr-2">
                            <div className="space-y-2">
                                {assignments['Unassigned']?.map(workerId => {
                                    const worker = getWorkerById(workerId)
                                    if (!worker) return null
                                    return (
                                        <div key={workerId} className="bg-white p-2 rounded border shadow-sm flex justify-between items-center group">
                                            <div>
                                                <div className="font-medium text-sm">{worker.name}</div>
                                                <div className="text-xs text-muted-foreground">{worker.role}</div>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="flex flex-wrap gap-1 justify-end max-w-[100px]">
                                                    {teams.map(t => (
                                                        <Button
                                                            key={t}
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-6 w-6 text-xs border hover:bg-blue-50 hover:text-blue-600"
                                                            onClick={() => moveWorker(workerId, t)}
                                                            title={`${t}로 이동`}
                                                        >
                                                            {t.replace('조', '')}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Targets: Teams */}
                <div className="col-span-9 grid grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-2">
                    {teams.map(team => (
                        <Card key={team} className="flex flex-col h-fit min-h-[200px]">
                            <CardHeader className="py-3 bg-slate-50 border-b">
                                <CardTitle className="text-sm flex justify-between items-center">
                                    {team}
                                    <Badge className="bg-blue-600">{assignments[team]?.length || 0}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-2 space-y-2">
                                {assignments[team]?.map(workerId => {
                                    const worker = getWorkerById(workerId)
                                    if (!worker) return null
                                    return (
                                        <div key={workerId} className="bg-white p-2 rounded border flex justify-between items-center group hover:border-blue-300 transition-colors">
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-slate-400" />
                                                <span className="text-sm font-medium">{worker.name}</span>
                                                <span className="text-xs text-muted-foreground">({worker.role})</span>
                                            </div>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-6 w-6 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100"
                                                onClick={() => moveWorker(workerId, 'Unassigned')}
                                                title="미배정으로 이동"
                                            >
                                                <ArrowLeft className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )
                                })}
                                {assignments[team]?.length === 0 && (
                                    <div className="text-center py-8 text-xs text-muted-foreground border-2 border-dashed rounded">
                                        배정된 인원 없음
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
