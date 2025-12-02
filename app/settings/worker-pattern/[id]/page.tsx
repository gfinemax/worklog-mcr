"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Calendar, Clock, MessageSquare, User } from "lucide-react"
import { format, parseISO } from "date-fns"
import { supabase } from "@/lib/supabase"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

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
    status?: 'active' | 'pending' | 'expired'
}

export default function ShiftDetailPage() {
    const router = useRouter()
    const params = useParams()
    const [config, setConfig] = useState<ShiftConfig | null>(null)
    const [teamMembers, setTeamMembers] = useState<Record<string, string[]>>({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (params.id) {
            fetchConfig(params.id as string)
            fetchTeamMembers()
        }
    }, [params.id])

    const fetchTeamMembers = async () => {
        const { data: members } = await supabase
            .from('group_members')
            .select(`
                user:users(name),
                group:groups(name)
            `)

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

    const fetchConfig = async (id: string) => {
        setLoading(true)
        const { data, error } = await supabase
            .from('shift_pattern_configs')
            .select(`
                *,
                created_by_user:users!created_by(name)
            `)
            .eq('id', id)
            .single()

        if (!error && data) {
            // Determine status (simplified logic, ideally passed or recalculated)
            // For display purposes, we might need to fetch all to determine 'active' correctly if it depends on others
            // But for now let's just display what we have. 
            // To get accurate status, we'd need to compare with others or pass it.
            // Since this is a detail page, we can just show the date.
            // If status is critical, we can fetch all and find this one.
            // Let's keep it simple for now.
            setConfig(data)
        }
        setLoading(false)
    }

    if (loading) {
        return <div className="p-8 flex justify-center">Loading...</div>
    }

    if (!config) {
        return <div className="p-8 text-center">Config not found</div>
    }

    return (
        <div className="container mx-auto py-6 space-y-6 max-w-5xl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                        근무형태 상세 정보
                        {/* Status badge could be added here if we calculate it */}
                    </h1>
                    <p className="text-muted-foreground">
                        설정된 근무 패턴의 상세 내용을 확인합니다.
                    </p>
                </div>
            </div>

            {/* Summary Section */}
            <Card>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-1">
                            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4" /> 적용 시작일
                            </div>
                            <div className="text-lg font-bold">
                                {format(parseISO(config.valid_from), 'yyyy.MM.dd')}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Clock className="h-4 w-4" /> 순환 주기
                            </div>
                            <div className="text-lg font-bold">
                                {config.cycle_length}일
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <User className="h-4 w-4" /> 등록자
                            </div>
                            <div className="text-lg font-medium">
                                {config.created_by_user?.name || "-"}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4" /> 등록일시
                            </div>
                            <div className="text-lg font-medium">
                                {config.created_at ? format(parseISO(config.created_at), 'yyyy.MM.dd HH:mm') : "-"}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t flex gap-4">
                        <MessageSquare className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="space-y-1 w-full">
                            <div className="text-sm font-medium text-muted-foreground">변경 사유 / 비고</div>
                            <div className="text-sm whitespace-pre-wrap leading-relaxed bg-slate-50 p-3 rounded-md border">
                                {config.memo || "입력된 내용이 없습니다."}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Pattern Table */}
            <Card>
                <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base">순환 패턴 (Day/Night)</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50 hover:bg-slate-50">
                                <TableHead className="w-[100px] text-center">Day</TableHead>
                                <TableHead className="w-[45%]">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-block w-2 h-2 rounded-full bg-yellow-400"></span>
                                        주간 (Day Shift)
                                    </div>
                                </TableHead>
                                <TableHead className="w-[45%]">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-block w-2 h-2 rounded-full bg-slate-800"></span>
                                        야간 (Night Shift)
                                    </div>
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {config.pattern_json?.map((day: any, i: number) => (
                                <TableRow key={i}>
                                    <TableCell className="text-center font-medium text-slate-500 bg-slate-50/30">
                                        D+{i}
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1.5">
                                            <div className="font-semibold text-base flex items-center gap-2">
                                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                                    {day.A.team}
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-slate-600 pl-1">
                                                {teamMembers?.[day.A.team]?.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {teamMembers[day.A.team].map((member, idx) => (
                                                            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs">
                                                                {member}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1.5">
                                            <div className="font-semibold text-base flex items-center gap-2">
                                                <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">
                                                    {day.N.team}
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-slate-600 pl-1">
                                                {teamMembers?.[day.N.team]?.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {teamMembers[day.N.team].map((member, idx) => (
                                                            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs">
                                                                {member}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-300">-</span>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
