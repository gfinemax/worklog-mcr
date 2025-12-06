"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowRight, ArrowLeft, User, Users } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { cn } from "@/lib/utils"

interface Step2RosterProps {
    data: {
        pattern: any[] // to determine number of teams
        assignments: Record<string, string[]> // teamName -> userIds
    }
    onChange: (data: any) => void
    onNext: () => void
    onBack: () => void
}

interface Worker {
    id: string
    name: string
    role: string
    current_team?: string
    display_order?: number
}

export function Step2Roster({ data, onChange, onNext, onBack }: Step2RosterProps) {
    const [workers, setWorkers] = useState<Worker[]>([])
    const [loading, setLoading] = useState(true)
    const [teams, setTeams] = useState<string[]>([])

    // Idle Detection State
    const [lastInteractionTime, setLastInteractionTime] = useState<number>(Date.now())
    const [isIdle, setIsIdle] = useState(false)

    // Idle Timer Loop
    useEffect(() => {
        const checkIdle = setInterval(() => {
            if (Date.now() - lastInteractionTime > 3000) {
                setIsIdle(true)
            } else {
                setIsIdle(false)
            }
        }, 1000)
        return () => clearInterval(checkIdle)
    }, [lastInteractionTime])

    const updateInteraction = () => {
        setLastInteractionTime(Date.now())
        setIsIdle(false)
    }

    // Determine teams from pattern
    useEffect(() => {
        const uniqueTeams = new Set<string>()
        data.pattern.forEach((p: any) => {
            if (p.A.team) uniqueTeams.add(p.A.team)
            if (p.N.team) uniqueTeams.add(p.N.team)
        })
        const sortedTeams = Array.from(uniqueTeams).sort()
        setTeams(sortedTeams)

        // Initialize assignments if empty
        if (Object.keys(data.assignments).length === 0) {
            const initialAssignments: Record<string, string[]> = {}
            sortedTeams.forEach(t => initialAssignments[t] = [])
            initialAssignments['Unassigned'] = [] // Placeholder for unassigned
            onChange({ ...data, assignments: initialAssignments })
        }
    }, [data.pattern])

    const fetchWorkers = async () => {
        try {
            setLoading(true)
            // Fetch users and their current group
            const { data: users, error } = await supabase
                .from('users')
                .select(`
                    id, name, role,
                    group_members(groups(name), display_order)
                `)
                .eq('is_active', true)
                .order('name')

            if (error) throw error

            if (users) {
                const formattedWorkers = users.map((u: any) => ({
                    id: u.id,
                    name: u.name,
                    role: u.role,
                    current_team: u.group_members?.[0]?.groups?.name || 'Unassigned',
                    display_order: u.group_members?.[0]?.display_order || 0
                }))
                setWorkers(formattedWorkers)
            }
        } catch (error) {
            console.error("Error fetching workers:", error)
        } finally {
            setLoading(false)
        }
    }

    // Fetch workers on mount
    useEffect(() => {
        fetchWorkers()
    }, [])

    // Initialize assignments when both teams and workers are ready
    useEffect(() => {
        if (teams.length === 0 || workers.length === 0) return

        // Only initialize if assignments are empty (or only have empty arrays from team init)
        const hasAssignments = Object.values(data.assignments).some(arr => arr.length > 0)

        if (!hasAssignments) {
            const newAssignments: Record<string, string[]> = {}
            teams.forEach(t => newAssignments[t] = [])
            newAssignments['Unassigned'] = []

            workers.forEach(w => {
                if (teams.includes(w.current_team || '')) {
                    newAssignments[w.current_team!].push(w.id)
                } else {
                    newAssignments['Unassigned'].push(w.id)
                }
            })

            // Sort by display_order
            Object.keys(newAssignments).forEach(team => {
                newAssignments[team].sort((aId, bId) => {
                    const wA = workers.find(w => w.id === aId)
                    const wB = workers.find(w => w.id === bId)
                    if (!wA || !wB) return 0
                    return (wA.display_order || 0) - (wB.display_order || 0)
                })
            })

            onChange({ ...data, assignments: newAssignments })
        }
    }, [teams, workers])

    // Ensure all workers are accounted for (fix for missing unassigned workers)
    useEffect(() => {
        if (teams.length === 0 || workers.length === 0) return

        const currentAssignedIds = new Set<string>()
        Object.values(data.assignments).forEach(ids => ids.forEach(id => currentAssignedIds.add(id)))

        const missingWorkers = workers.filter(w => !currentAssignedIds.has(w.id))

        if (missingWorkers.length > 0) {
            const newAssignments = { ...data.assignments }
            if (!newAssignments['Unassigned']) newAssignments['Unassigned'] = []

            missingWorkers.forEach(w => {
                if (!newAssignments['Unassigned'].includes(w.id)) {
                    newAssignments['Unassigned'].push(w.id)
                }
            })

            onChange({ ...data, assignments: newAssignments })
        }
    }, [workers, data.assignments])

    const moveWorker = (workerId: string, targetTeam: string) => {
        const newAssignments = { ...data.assignments }

        // Remove from all teams first
        Object.keys(newAssignments).forEach(team => {
            newAssignments[team] = newAssignments[team].filter(id => id !== workerId)
        })

        // Add to target
        if (!newAssignments[targetTeam]) newAssignments[targetTeam] = []
        newAssignments[targetTeam].push(workerId)

        onChange({ ...data, assignments: newAssignments })
        updateInteraction()
    }

    const getWorkerById = (id: string) => workers.find(w => w.id === id)

    // Check if all workers are assigned
    const unassignedCount = data.assignments['Unassigned']?.length || 0
    const MIN_TEAM_SIZE = 3
    const isValid = teams.every(team => (data.assignments[team]?.length || 0) >= MIN_TEAM_SIZE)

    return (
        <div className="h-full flex flex-col gap-4">
            <div className="flex justify-between items-center bg-white p-2 rounded-lg border shadow-sm">
                <div className="px-2">
                    <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold">근무자 배정</h3>
                        {unassignedCount > 0 && (
                            <Badge variant="destructive" className="animate-pulse">
                                미배정: {unassignedCount}명
                            </Badge>
                        )}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        근무조에 인원을 배치합니다. 만약 근무자가 안보일 경우 근무자 명단의 근무배치를 확인해보세요.
                    </div>
                </div>
                <div className="flex gap-2 items-center">



                    <Button
                        onClick={onNext}
                        disabled={!isValid}
                        className={cn(
                            "bg-blue-600 hover:bg-blue-700 transition-all duration-500",
                            isValid && isIdle ? "ring-4 ring-blue-300 ring-offset-2 animate-pulse shadow-lg" : ""
                        )}
                    >
                        다음 단계 <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
                {/* Source: Unassigned */}
                <Card className="col-span-3 flex flex-col h-full border-red-200 bg-red-50/30">
                    <CardHeader className="py-3">
                        <CardTitle className="text-sm flex justify-between">
                            미배정
                            <Badge variant="secondary">{data.assignments['Unassigned']?.length || 0}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-2">
                        <ScrollArea className="h-full pr-2">
                            <div className="space-y-2">
                                {data.assignments['Unassigned']?.map(workerId => {
                                    const worker = getWorkerById(workerId)
                                    if (!worker) return null
                                    return (
                                        <div key={workerId} className="bg-white p-2 rounded border shadow-sm flex justify-between items-center group">
                                            <div>
                                                <div className="font-medium text-sm">{worker.name}</div>
                                                <div className="text-xs text-muted-foreground">{worker.role}</div>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                {/* Quick move buttons */}
                                                <div className="flex flex-wrap gap-1 justify-end max-w-[150px]">
                                                    {teams.map(t => (
                                                        <Button
                                                            key={t}
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-6 w-6 text-xs border"
                                                            onClick={() => moveWorker(workerId, t)}
                                                            title={`Move to ${t}`}
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
                                    <Badge className="bg-blue-600">{data.assignments[team]?.length || 0}</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-2 space-y-2">
                                {data.assignments[team]?.map(workerId => {
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
                                            >
                                                <ArrowLeft className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )
                                })}
                                {data.assignments[team]?.length === 0 && (
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
