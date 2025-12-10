"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Printer, Edit2, Trash2, Phone, Monitor, Radio, Satellite, CheckCircle2 } from "lucide-react"
import { useBroadcastStore, BroadcastSchedule } from "@/store/broadcast"
import { BroadcastWizard } from "./broadcast-wizard"
import { BroadcastTimeline } from "./broadcast-timeline"
import { StatusIndicator } from "./status-indicator"
import { toast } from "sonner"
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

interface BroadcastDetailProps {
    date: string
}

// 수신 경로를 간결한 형식으로 변환 (JSX 반환)
// "메인: IP > LiveU > FA3AO / 백업: 위성 > TVRO > TVRO-1, TVRO-3" → "(M)FA3AO (B) TVRO-1 TVRO-3"
function formatReceptionPath(path: string): React.ReactNode {
    if (!path) return null

    let mainEquipment = ''
    const backupEquipments: string[] = []

    // 메인 추출 - 마지막 > 이후의 장비명만
    const mainSection = path.match(/메인:\s*([^\/]+)/)
    if (mainSection) {
        const mainParts = mainSection[1].split('>')
        mainEquipment = mainParts[mainParts.length - 1].trim()
    }

    // 백업 추출 - 각 백업에서 마지막 장비명만
    const backupSection = path.match(/백업:\s*(.+)/)
    if (backupSection) {
        const backupSignals = backupSection[1].split(',')
        for (const signal of backupSignals) {
            const signalParts = signal.split('>')
            const equipment = signalParts[signalParts.length - 1].trim()
            if (equipment) backupEquipments.push(equipment)
        }
    }

    // 기존 형식 (메인/백업 구분 없는 경우)
    if (!mainEquipment && backupEquipments.length === 0) {
        const allParts = path.split('>')
        return allParts[allParts.length - 1].trim() || path
    }

    return (
        <>
            {mainEquipment && <><span className="font-bold">(M)</span>{mainEquipment} </>}
            {backupEquipments.length > 0 && (
                <><span className="font-bold">(B)</span> {backupEquipments.join(' ')}</>
            )}
        </>
    )
}

export function BroadcastDetail({ date }: BroadcastDetailProps) {
    const schedules = useBroadcastStore((state) => state.schedules)
    const loading = useBroadcastStore((state) => state.loading)
    const fetchSchedules = useBroadcastStore((state) => state.fetchSchedules)
    const deleteSchedule = useBroadcastStore((state) => state.deleteSchedule)

    const [formOpen, setFormOpen] = useState(false)
    const [editingSchedule, setEditingSchedule] = useState<BroadcastSchedule | null>(null)
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean
        schedule: BroadcastSchedule | null
    }>({ open: false, schedule: null })

    useEffect(() => {
        fetchSchedules(date)
    }, [date, fetchSchedules])

    const broadcasts = schedules.filter(s => s.date === date && s.type === 'broadcast')
    const receptions = schedules.filter(s => s.date === date && s.type === 'reception')

    const handleEdit = (schedule: BroadcastSchedule) => {
        setEditingSchedule(schedule)
        setFormOpen(true)
    }

    const handleDelete = async () => {
        if (!deleteDialog.schedule) return

        const { error } = await deleteSchedule(deleteDialog.schedule.id)
        if (error) {
            toast.error("삭제 중 오류가 발생했습니다.")
        } else {
            toast.success("삭제되었습니다.")
        }
        setDeleteDialog({ open: false, schedule: null })
    }

    const handleFormClose = () => {
        setFormOpen(false)
        setEditingSchedule(null)
    }

    const handlePrint = () => {
        window.print()
    }

    const dateObj = new Date(date + 'T00:00:00')

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center print:hidden">
                <h1 className="text-2xl font-bold">
                    {format(dateObj, 'yyyy년 MM월 dd일 EEEE', { locale: ko })} 중계현황
                </h1>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => window.open(`/broadcasts/${date}/monitor`, '_blank')}
                    >
                        <Monitor className="mr-2 h-4 w-4" />
                        전체화면
                    </Button>
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        인쇄하기
                    </Button>
                </div>
            </div>

            {/* Dashboard Header */}
            {!loading && (broadcasts.length > 0 || receptions.length > 0) && (
                <Card className="bg-gradient-to-r from-slate-50 to-slate-100">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-4 gap-4 mb-6">
                            {/* 총 건수 */}
                            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm">
                                <span className="text-3xl font-bold text-gray-800">{broadcasts.length + receptions.length}</span>
                                <span className="text-sm text-muted-foreground">총 건수</span>
                            </div>
                            {/* 라이브 */}
                            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm">
                                <div className="flex items-center gap-2">
                                    <Radio className="h-5 w-5 text-red-500" />
                                    <span className="text-3xl font-bold text-red-600">{broadcasts.length}</span>
                                </div>
                                <span className="text-sm text-muted-foreground">라이브</span>
                            </div>
                            {/* 수신 */}
                            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm">
                                <div className="flex items-center gap-2">
                                    <Satellite className="h-5 w-5 text-blue-500" />
                                    <span className="text-3xl font-bold text-blue-600">{receptions.length}</span>
                                </div>
                                <span className="text-sm text-muted-foreground">수신</span>
                            </div>
                            {/* 완료 */}
                            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl shadow-sm">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    <span className="text-3xl font-bold text-green-600">
                                        {[...broadcasts, ...receptions].filter(s => s.status === 'completed').length}
                                    </span>
                                </div>
                                <span className="text-sm text-muted-foreground">완료</span>
                            </div>
                        </div>

                        {/* 타임라인 */}
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">⏱️ 타임라인</h3>
                            <BroadcastTimeline schedules={[...broadcasts, ...receptions]} />
                        </div>
                    </CardContent>
                </Card>
            )}

            {loading ? (
                <div className="flex justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Broadcast Section */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-6 w-1 bg-red-600 rounded-full"></div>
                            <h2 className="text-xl font-bold text-gray-800">TITAN LIVE ON</h2>
                            <Badge variant="destructive">{broadcasts.length}건</Badge>
                        </div>

                        <div className="grid gap-4">
                            {broadcasts.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                    예정된 중계 일정이 없습니다.
                                </div>
                            ) : (
                                broadcasts.map(schedule => (
                                    <BroadcastCard
                                        key={schedule.id}
                                        schedule={schedule}
                                        onEdit={() => handleEdit(schedule)}
                                        onDelete={() => setDeleteDialog({ open: true, schedule })}
                                    />
                                ))
                            )}
                        </div>
                    </section>

                    <div className="border-t-4 border-dashed border-gray-300 my-8 relative">
                        <span className="absolute left-1/2 -translate-x-1/2 -top-3 bg-white px-4 text-gray-500 font-bold">
                            수 신
                        </span>
                    </div>

                    {/* Reception Section */}
                    <section>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="h-6 w-1 bg-blue-600 rounded-full"></div>
                            <h2 className="text-xl font-bold text-gray-800">수신 현황</h2>
                            <Badge className="bg-blue-600">{receptions.length}건</Badge>
                        </div>

                        <div className="grid gap-4">
                            {receptions.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                    예정된 수신 일정이 없습니다.
                                </div>
                            ) : (
                                receptions.map(schedule => (
                                    <BroadcastCard
                                        key={schedule.id}
                                        schedule={schedule}
                                        onEdit={() => handleEdit(schedule)}
                                        onDelete={() => setDeleteDialog({ open: true, schedule })}
                                    />
                                ))
                            )}
                        </div>
                    </section>
                </div>
            )}

            {/* Wizard Dialog */}
            <BroadcastWizard
                open={formOpen}
                onClose={handleFormClose}
                schedule={editingSchedule}
                defaultDate={date}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, schedule: open ? deleteDialog.schedule : null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>중계 일정 삭제</AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteDialog.schedule && (
                                <>
                                    <strong>{deleteDialog.schedule.time}</strong> {deleteDialog.schedule.channel_name} - {deleteDialog.schedule.program_title} 일정을 삭제하시겠습니까?
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            삭제
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

function BroadcastCard({
    schedule,
    onEdit,
    onDelete
}: {
    schedule: BroadcastSchedule
    onEdit: () => void
    onDelete: () => void
}) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="py-0.5 px-4">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Time & Channel */}
                    <div className="flex flex-col min-w-[140px] gap-1">
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-gray-900">{schedule.time.slice(0, 5)}</span>
                            {schedule.end_time && (
                                <span className="text-lg text-gray-500">~{schedule.end_time.slice(0, 5)}</span>
                            )}
                        </div>
                        {schedule.end_time && (() => {
                            const [sh, sm] = schedule.time.slice(0, 5).split(':').map(Number)
                            const [eh, em] = schedule.end_time.slice(0, 5).split(':').map(Number)
                            const duration = (eh * 60 + em) - (sh * 60 + sm)
                            if (duration > 0) {
                                const hours = Math.floor(duration / 60)
                                const mins = duration % 60
                                return (
                                    <span className="text-xs text-gray-500">
                                        ({hours > 0 ? `${hours}시간 ` : ''}{mins > 0 ? `${mins}분` : ''})
                                    </span>
                                )
                            }
                            return null
                        })()}
                        <span className="text-lg font-bold text-red-600">{schedule.channel_name}</span>
                        {schedule.studio_label && (
                            <Badge variant="outline" className="w-fit text-base bg-yellow-400 text-yellow-900 font-bold border-transparent">
                                {schedule.studio_label}
                            </Badge>
                        )}
                    </div>

                    {/* Program Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                        <h3 className="text-lg font-bold text-gray-900">{schedule.program_title}</h3>
                        {schedule.match_info && (
                            <p className="text-base font-medium text-gray-700">&lt;{schedule.match_info}&gt;</p>
                        )}
                        {schedule.broadcast_van && (
                            <p className="text-sm font-bold text-green-600">중계차: {schedule.broadcast_van}</p>
                        )}
                        {schedule.memo && (
                            <p className="text-sm font-bold text-red-500">{schedule.memo}</p>
                        )}
                    </div>

                    {/* Technical Info */}
                    <div className="flex flex-col gap-1 text-sm min-w-[220px]">
                        {schedule.transmission_path && (
                            <div className="font-medium text-red-600">
                                수신: {formatReceptionPath(schedule.transmission_path)}
                            </div>
                        )}
                        {schedule.video_source_info && (
                            <div className="font-medium text-green-700">송신: {schedule.video_source_info}</div>
                        )}
                        {schedule.return_info && (
                            <div className="font-medium text-purple-700">리턴: {schedule.return_info}</div>
                        )}
                        {schedule.biss_code && (
                            <div className="font-mono font-medium text-gray-600">BISS: {schedule.biss_code}</div>
                        )}
                        {(schedule.manager || schedule.contact_info) && (
                            <div className="flex items-center gap-1 text-blue-600 font-medium mt-1">
                                <Phone className="h-3 w-3" />
                                {schedule.manager}
                                {schedule.contact_info && (
                                    <span className="text-muted-foreground">({schedule.contact_info})</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex md:flex-col gap-2 print:hidden">
                        <Button variant="outline" size="sm" onClick={onEdit}>
                            <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={onDelete} className="text-red-600 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
