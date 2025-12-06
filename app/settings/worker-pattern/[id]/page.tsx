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
import { MainLayout } from "@/components/layout/main-layout"

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
            setConfig(data)
        }
        setLoading(false)
    }

    return (
        <MainLayout>
            <div className="container mx-auto py-6 max-w-5xl">
                <div className="mb-6 flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">근무형태 상세 정보</h1>
                        <p className="text-muted-foreground">
                            설정된 근무 패턴의 상세 내용을 확인합니다.
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                ) : !config ? (
                    <div className="text-center py-8 text-muted-foreground">
                        설정 정보를 찾을 수 없습니다.
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Summary Card */}
                        <Card>
                            <CardContent className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            적용 시작일
                                        </div>
                                        <div className="font-semibold text-lg">
                                            {format(parseISO(config.valid_from), 'yyyy.MM.dd')}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Clock className="h-4 w-4" />
                                            순환 주기
                                        </div>
                                        <div className="font-semibold text-lg">
                                            {config.cycle_length}일
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <User className="h-4 w-4" />
                                            등록자
                                        </div>
                                        <div className="font-semibold text-lg">
                                            {config.created_by_user?.name || '-'}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="h-4 w-4" />
                                            등록일시
                                        </div>
                                        <div className="font-semibold text-lg">
                                            {config.created_at ? format(parseISO(config.created_at), 'yyyy.MM.dd HH:mm') : "-"}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <MessageSquare className="h-4 w-4" />
                                            변경 사유 / 비고
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-md text-sm min-h-[40px]">
                                            {config.memo || '-'}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pattern Table */}
                        <Card>
                            <CardHeader>
                                <CardTitle>순환패턴(A/N)</CardTitle>
                                {config.pattern_json && config.pattern_json.length > 0 && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        적용일({format(parseISO(config.valid_from), 'yyyy.MM.dd')})기준으로 1일차는 {config.pattern_json[0].A.team}부터 시작합니다.
                                    </p>
                                )}
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                                            <TableHead className="w-[100px] text-center font-bold text-slate-700">Day</TableHead>
                                            <TableHead className="font-bold text-slate-700">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                                                    주간(A)
                                                </span>
                                            </TableHead>
                                            <TableHead className="font-bold text-slate-700">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <span className="h-2 w-2 rounded-full bg-slate-800"></span>
                                                    야간(N)
                                                </span>
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {config.pattern_json?.map((day: any, i: number) => (
                                            <TableRow key={i}>
                                                <TableCell className="text-center font-medium text-slate-500 bg-slate-50/30">
                                                    {i + 1}일차
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1.5">
                                                        <div className="font-semibold text-base flex items-center gap-2">
                                                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                                                {day.A.team}
                                                            </Badge>
                                                            {day.A.is_swap && <Badge variant="outline" className="h-5 px-1.5 text-[10px] border-orange-200 text-orange-600 bg-orange-50">SWAP</Badge>}
                                                        </div>
                                                        <div className="text-sm text-slate-600 pl-1">
                                                            {(() => {
                                                                const members = teamMembers?.[day.A.team] || []
                                                                if (members.length === 0) return <span className="text-slate-300">-</span>

                                                                let displayMembers = [...members]
                                                                if (day.A.is_swap && displayMembers.length >= 2) {
                                                                    const temp = displayMembers[0]
                                                                    displayMembers[0] = displayMembers[1]
                                                                    displayMembers[1] = temp
                                                                }

                                                                return (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {displayMembers.map((name, idx) => {
                                                                            let roleLabel = ''
                                                                            if (idx === 0) roleLabel = '감독'
                                                                            else if (idx === 1) roleLabel = '부감독'
                                                                            else if (idx === 2) roleLabel = '영상'

                                                                            return (
                                                                                <span key={idx} className="inline-flex items-center gap-0.5 bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                                                                                    <span>{name}</span>
                                                                                    {roleLabel && <span className="text-[9px] text-slate-400 font-normal">({roleLabel})</span>}
                                                                                </span>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                )
                                                            })()}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1.5">
                                                        <div className="font-semibold text-base flex items-center gap-2">
                                                            <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200">
                                                                {day.N.team}
                                                            </Badge>
                                                            {day.N.is_swap && <Badge variant="outline" className="h-5 px-1.5 text-[10px] border-orange-200 text-orange-600 bg-orange-50">SWAP</Badge>}
                                                        </div>
                                                        <div className="text-sm text-slate-600 pl-1">
                                                            {(() => {
                                                                const members = teamMembers?.[day.N.team] || []
                                                                if (members.length === 0) return <span className="text-slate-300">-</span>

                                                                let displayMembers = [...members]
                                                                if (day.N.is_swap && displayMembers.length >= 2) {
                                                                    const temp = displayMembers[0]
                                                                    displayMembers[0] = displayMembers[1]
                                                                    displayMembers[1] = temp
                                                                }

                                                                return (
                                                                    <div className="flex flex-wrap gap-1">
                                                                        {displayMembers.map((name, idx) => {
                                                                            let roleLabel = ''
                                                                            if (idx === 0) roleLabel = '감독'
                                                                            else if (idx === 1) roleLabel = '부감독'
                                                                            else if (idx === 2) roleLabel = '영상'

                                                                            return (
                                                                                <span key={idx} className="inline-flex items-center gap-0.5 bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">
                                                                                    <span>{name}</span>
                                                                                    {roleLabel && <span className="text-[9px] text-slate-400 font-normal">({roleLabel})</span>}
                                                                                </span>
                                                                            )
                                                                        })}
                                                                    </div>
                                                                )
                                                            })()}
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
                )}
            </div>
        </MainLayout >
    )
}
