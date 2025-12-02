"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { supabase } from "@/lib/supabase"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Loader2, Activity, User, Settings, Users, ArrowRight } from "lucide-react"

interface AuditLog {
    id: string
    action: string
    target_type: string
    changes: any
    created_at: string
    users: {
        name: string
        email: string
    } | null
}

export function AuditLogList() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchLogs()
    }, [])

    const fetchLogs = async () => {
        try {
            const { data, error } = await supabase
                .from('audit_logs')
                .select(`
          *,
          users (
            name,
            email
          )
        `)
                .order('created_at', { ascending: false })
                .limit(50)

            if (error) throw error
            setLogs(data || [])
        } catch (error) {
            console.error("Error fetching timeline:", error)
        } finally {
            setLoading(false)
        }
    }

    const getIcon = (action: string) => {
        if (action.includes('SHIFT')) return <Settings className="h-4 w-4" />
        if (action.includes('WORKER')) return <User className="h-4 w-4" />
        if (action.includes('GROUP')) return <Users className="h-4 w-4" />
        return <Activity className="h-4 w-4" />
    }

    const getActionLabel = (action: string) => {
        switch (action) {
            case 'UPDATE_SHIFT_PATTERN': return '근무 패턴 변경'
            case 'CREATE_SHIFT_CONFIG': return '근무 패턴 생성'
            case 'MOVE_WORKER': return '근무자 이동'
            case 'CREATE_WORKER': return '근무자 등록'
            case 'DELETE_WORKER': return '근무자 삭제'
            case 'UPDATE_WORKER': return '근무자 정보 수정'
            default: return action
        }
    }

    const renderChanges = (changes: any) => {
        if (!changes) return null

        // Pattern Change
        if (changes.cycle_length) {
            return (
                <div className="mt-2 text-xs bg-slate-50 p-2 rounded border">
                    <p>순환 주기: {changes.cycle_length}일</p>
                    <p>기준일: {changes.valid_from}</p>
                    {changes.teams && <p>운영 조: {changes.teams.length}개</p>}
                    {changes.memo && <p className="mt-1 text-slate-500">{changes.memo}</p>}
                </div>
            )
        }

        // Worker Move
        if (changes.from_group || changes.to_group) {
            return (
                <div className="mt-2 flex items-center gap-2 text-xs bg-slate-50 p-2 rounded border">
                    <span className="font-medium">{changes.from_group || '미배치'}</span>
                    <ArrowRight className="h-3 w-3 text-slate-400" />
                    <span className="font-medium text-blue-600">{changes.to_group}</span>
                </div>
            )
        }

        return null
    }

    return (
        <Card className="h-full border-none shadow-none">
            <CardHeader className="px-0 pt-0">
                <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    <CardTitle>변경 로그 (Audit Trail)</CardTitle>
                </div>
                <CardDescription>
                    시스템 내의 주요 변경 사항과 작업 이력을 추적합니다.
                </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
                <ScrollArea className="h-[600px] pr-4">
                    {loading ? (
                        <div className="flex justify-center p-4">
                            <Loader2 className="animate-spin h-6 w-6 text-muted-foreground" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center text-muted-foreground p-4">
                            기록된 히스토리가 없습니다.
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {logs.map((log) => (
                                <div key={log.id} className="relative pl-6 border-l-2 border-slate-100 pb-6 last:pb-0">
                                    <div className="absolute -left-[9px] top-0 bg-white p-1 rounded-full border border-slate-200">
                                        {getIcon(log.action)}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm">
                                                {getActionLabel(log.action)}
                                            </span>
                                            <Badge variant="outline" className="text-[10px] font-normal">
                                                {format(new Date(log.created_at), 'yyyy.MM.dd HH:mm', { locale: ko })}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            <span className="font-medium text-slate-700">{log.users?.name || '시스템'}</span>
                                            님이 변경했습니다.
                                        </p>
                                        {renderChanges(log.changes)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    )
}
