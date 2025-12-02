"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { format, parseISO } from "date-fns"
import { MessageSquare, Calendar, User, Clock } from "lucide-react"

interface ShiftDetailDialogProps {
    config: any | null
    open: boolean
    onOpenChange: (open: boolean) => void
    teamMembers?: Record<string, string[]>
}

export function ShiftDetailDialog({ config, open, onOpenChange, teamMembers = {} }: ShiftDetailDialogProps) {
    if (!config) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        근무형태 상세 정보
                        {config.status === 'active' && <Badge className="bg-green-600 h-5 px-1.5 text-[10px]">적용중</Badge>}
                        {config.status === 'pending' && <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 h-5 px-1.5 text-[10px]">대기</Badge>}
                        {config.status === 'expired' && <Badge variant="outline" className="h-5 px-1.5 text-[10px]">종료</Badge>}
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        설정된 근무 패턴의 상세 내용을 확인합니다.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-3">
                        <Card className="shadow-sm">
                            <CardHeader className="pb-1 pt-3 px-4">
                                <CardTitle className="text-xs font-medium text-muted-foreground">적용 시작일</CardTitle>
                            </CardHeader>
                            <CardContent className="pb-3 px-4">
                                <div className="text-lg font-bold flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-blue-500" />
                                    {format(parseISO(config.valid_from), 'yyyy.MM.dd')}
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-sm">
                            <CardHeader className="pb-1 pt-3 px-4">
                                <CardTitle className="text-xs font-medium text-muted-foreground">순환 주기</CardTitle>
                            </CardHeader>
                            <CardContent className="pb-3 px-4">
                                <div className="text-lg font-bold flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-blue-500" />
                                    {config.cycle_length}일
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Memo & Meta */}
                    <Card className="bg-slate-50/50 shadow-sm">
                        <CardContent className="p-4 space-y-3">
                            <div className="flex gap-3">
                                <MessageSquare className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                                <div className="space-y-0.5 w-full">
                                    <p className="text-xs font-medium text-slate-900">변경 사유 / 비고</p>
                                    <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">
                                        {config.memo || "입력된 내용이 없습니다."}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3 pt-3 border-t border-slate-200/60">
                                <User className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                                <div className="grid grid-cols-2 gap-8 w-full">
                                    <div>
                                        <p className="text-[10px] font-medium text-slate-500">등록자</p>
                                        <p className="text-xs text-slate-700">{config.created_by_user?.name || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-medium text-slate-500">등록일시</p>
                                        <p className="text-xs text-slate-700">
                                            {config.created_at ? format(parseISO(config.created_at), 'yyyy.MM.dd HH:mm') : "-"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pattern Grid */}
                    <Card className="shadow-sm">
                        <CardHeader className="py-3 px-4 border-b">
                            <CardTitle className="text-sm">순환 패턴 (Day/Night)</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[240px]">
                                <div className="divide-y">
                                    {config.pattern_json?.map((day: any, i: number) => (
                                        <div key={i} className="flex items-start gap-3 p-3 text-sm hover:bg-slate-50/50 transition-colors">
                                            <div className="w-10 pt-0.5 font-bold text-slate-500 text-xs text-center border rounded bg-slate-100/50 py-1">
                                                D+{i}
                                            </div>
                                            <div className="flex-1 grid grid-cols-2 gap-4">
                                                {/* Day Team */}
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded border border-yellow-200">주간</span>
                                                        <span className="font-semibold text-slate-900">{day.A.team}</span>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground pl-1 break-keep leading-snug">
                                                        {teamMembers?.[day.A.team]?.length > 0
                                                            ? teamMembers[day.A.team].join(', ')
                                                            : <span className="text-slate-300">-</span>}
                                                    </div>
                                                </div>

                                                {/* Night Team */}
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold bg-slate-800 text-white px-1.5 py-0.5 rounded border border-slate-700">야간</span>
                                                        <span className="font-semibold text-slate-900">{day.N.team}</span>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground pl-1 break-keep leading-snug">
                                                        {teamMembers?.[day.N.team]?.length > 0
                                                            ? teamMembers[day.N.team].join(', ')
                                                            : <span className="text-slate-300">-</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end pt-2">
                        <Button onClick={() => onOpenChange(false)} size="sm">닫기</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
