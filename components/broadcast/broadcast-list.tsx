"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Search, CalendarIcon, Plus, ArrowUpDown, ArrowUp, ArrowDown, MoreVertical, Edit2, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useBroadcastStore, BroadcastSchedule } from "@/store/broadcast"
import { useBroadcastTabStore } from "@/store/broadcast-tab-store"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { toast } from "sonner"

type SortConfig = {
    key: keyof BroadcastSchedule
    direction: 'asc' | 'desc'
} | null

interface BroadcastListViewProps {
    onNewClick?: () => void
}

// 수신 경로를 간결한 형식으로 변환 (JSX 반환)
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

    // 기존 형식
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

export function BroadcastListView({ onNewClick }: BroadcastListViewProps) {
    const router = useRouter()
    const schedules = useBroadcastStore((state) => state.schedules)
    const loading = useBroadcastStore((state) => state.loading)
    const fetchSchedules = useBroadcastStore((state) => state.fetchSchedules)
    const deleteSchedule = useBroadcastStore((state) => state.deleteSchedule)
    const { addTab } = useBroadcastTabStore()

    const [sortConfig, setSortConfig] = useState<SortConfig>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [dateQuery, setDateQuery] = useState("")
    const [typeFilter, setTypeFilter] = useState<string>("all")

    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean
        schedule: BroadcastSchedule | null
    }>({ open: false, schedule: null })

    useEffect(() => {
        fetchSchedules()
    }, [fetchSchedules])

    const filteredSchedules = useMemo(() => {
        return schedules.filter(s => {
            // Date Filter
            if (dateQuery && !s.date.includes(dateQuery)) return false

            // Type Filter
            if (typeFilter !== "all" && s.type !== typeFilter) return false

            // Search Filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase().trim()
                return (
                    s.date.includes(query) ||
                    s.channel_name.toLowerCase().includes(query) ||
                    s.program_title.toLowerCase().includes(query) ||
                    (s.match_info && s.match_info.toLowerCase().includes(query)) ||
                    (s.manager && s.manager.toLowerCase().includes(query))
                )
            }
            return true
        })
    }, [schedules, dateQuery, typeFilter, searchQuery])

    const sortedSchedules = useMemo(() => {
        let sortable = [...filteredSchedules]
        if (sortConfig !== null) {
            sortable.sort((a, b) => {
                let aValue: any = a[sortConfig.key]
                let bValue: any = b[sortConfig.key]

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
                return 0
            })
        }
        return sortable
    }, [filteredSchedules, sortConfig])

    const requestSort = (key: keyof BroadcastSchedule) => {
        let direction: 'asc' | 'desc' = 'asc'
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc'
        }
        setSortConfig({ key, direction })
    }

    const getSortIcon = (key: keyof BroadcastSchedule) => {
        if (!sortConfig || sortConfig.key !== key) {
            return <ArrowUpDown className="h-4 w-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        }
        return sortConfig.direction === 'asc' ? (
            <ArrowUp className="h-4 w-4" />
        ) : (
            <ArrowDown className="h-4 w-4" />
        )
    }

    const handleRowClick = (schedule: BroadcastSchedule) => {
        addTab({
            id: schedule.date,
            title: format(new Date(schedule.date), 'MM/dd (EEE)', { locale: ko }),
            date: schedule.date
        })
        router.push(`/broadcasts?date=${schedule.date}`)
    }

    const handleDeleteClick = (e: React.MouseEvent, schedule: BroadcastSchedule) => {
        e.stopPropagation()
        setDeleteDialog({ open: true, schedule })
    }

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.schedule) return

        const { error } = await deleteSchedule(deleteDialog.schedule.id)
        if (error) {
            toast.error("삭제 중 오류가 발생했습니다.")
        } else {
            toast.success("중계 일정이 삭제되었습니다.")
        }
        setDeleteDialog({ open: false, schedule: null })
    }

    // Group by date for summary
    const dateSummary = useMemo(() => {
        const dates = new Set(schedules.map(s => s.date))
        const broadcast = schedules.filter(s => s.type === 'broadcast').length
        const reception = schedules.filter(s => s.type === 'reception').length
        return { total: dates.size, broadcast, reception }
    }, [schedules])

    return (
        <div className="space-y-6">
            <Card className="rounded-tl-none shadow-none border-t-0">
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        {/* Left Side: Filters */}
                        <div className="flex flex-1 items-center gap-2">
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="검색..."
                                    className="pl-8"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-[200px] justify-start text-left font-normal",
                                            !dateQuery && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateQuery ? dateQuery : "날짜 선택"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={dateQuery ? new Date(dateQuery) : undefined}
                                        onSelect={(date) => setDateQuery(date ? format(date, "yyyy-MM-dd") : "")}
                                        initialFocus
                                    />
                                    <div className="p-3 border-t border-border">
                                        <Button variant="ghost" className="w-full" onClick={() => setDateQuery("")}>
                                            전체
                                        </Button>
                                    </div>
                                </PopoverContent>
                            </Popover>

                            <div className="flex gap-1">
                                <Button
                                    variant={typeFilter === "all" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setTypeFilter("all")}
                                >
                                    전체
                                </Button>
                                <Button
                                    variant={typeFilter === "broadcast" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setTypeFilter("broadcast")}
                                    className={typeFilter === "broadcast" ? "bg-red-600 hover:bg-red-700" : ""}
                                >
                                    라이브
                                </Button>
                                <Button
                                    variant={typeFilter === "reception" ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setTypeFilter("reception")}
                                    className={typeFilter === "reception" ? "bg-blue-600 hover:bg-blue-700" : ""}
                                >
                                    수신
                                </Button>
                            </div>
                        </div>

                        {/* Right Side: Summary */}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground whitespace-nowrap">
                            <div className="flex items-center gap-2">
                                <span>날짜 <span className="font-bold text-foreground">{dateSummary.total}</span></span>
                                <span className="text-gray-300">|</span>
                                <span>라이브 <span className="font-bold text-red-600">{dateSummary.broadcast}</span></span>
                                <span className="text-gray-300">|</span>
                                <span>수신 <span className="font-bold text-blue-600">{dateSummary.reception}</span></span>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center p-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : sortedSchedules.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            등록된 중계 일정이 없습니다.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-center">
                                        <Button variant="ghost" onClick={() => requestSort('date')} className="group h-8 p-0 font-bold hover:bg-transparent w-full justify-center">
                                            <span className="relative flex items-center">
                                                날짜
                                                <span className="absolute left-full ml-2">{getSortIcon('date')}</span>
                                            </span>
                                        </Button>
                                    </TableHead>
                                    <TableHead className="text-center">타입</TableHead>
                                    <TableHead className="text-center">채널</TableHead>
                                    <TableHead className="text-center">
                                        <Button variant="ghost" onClick={() => requestSort('time')} className="group h-8 p-0 font-bold hover:bg-transparent w-full justify-center">
                                            <span className="relative flex items-center">
                                                시간
                                                <span className="absolute left-full ml-2">{getSortIcon('time')}</span>
                                            </span>
                                        </Button>
                                    </TableHead>
                                    <TableHead className="text-center">종목/제목</TableHead>
                                    <TableHead className="text-center">수신</TableHead>
                                    <TableHead className="text-center">본사망</TableHead>
                                    <TableHead className="text-center">담당</TableHead>
                                    <TableHead className="text-center w-12"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {sortedSchedules.map((schedule) => (
                                    <TableRow
                                        key={schedule.id}
                                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                                        onClick={() => handleRowClick(schedule)}
                                    >
                                        <TableCell className="font-medium text-center">
                                            {format(new Date(schedule.date), 'MM/dd (EEE)', { locale: ko })}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                variant={schedule.type === 'broadcast' ? 'destructive' : 'default'}
                                                className={schedule.type === 'reception' ? 'bg-blue-600' : ''}
                                            >
                                                {schedule.type === 'broadcast' ? '라이브' : '수신'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="font-bold text-red-600">{schedule.channel_name}</span>
                                            {schedule.studio_label && (
                                                <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800">
                                                    {schedule.studio_label}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center font-medium">{schedule.time.slice(0, 5)}</TableCell>
                                        <TableCell className="text-center">
                                            <div className="font-medium">{schedule.program_title}</div>
                                            {schedule.match_info && (
                                                <div className="text-sm text-muted-foreground">{schedule.match_info}</div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center text-sm text-red-600 font-medium">
                                            {formatReceptionPath(schedule.transmission_path || '')}
                                        </TableCell>
                                        <TableCell className="text-center text-sm text-purple-600">
                                            {schedule.return_info}
                                        </TableCell>
                                        <TableCell className="text-center text-sm">
                                            {schedule.manager}
                                        </TableCell>
                                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleRowClick(schedule)}>
                                                        <Edit2 className="mr-2 h-4 w-4" />
                                                        수정
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={(e) => handleDeleteClick(e, schedule)}
                                                        className="text-red-600 focus:text-red-600"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        삭제
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, schedule: open ? deleteDialog.schedule : null })}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>중계 일정 삭제</AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteDialog.schedule && (
                                <>
                                    <strong>{deleteDialog.schedule.date}</strong> {deleteDialog.schedule.channel_name} {deleteDialog.schedule.program_title} 일정을 삭제하시겠습니까?
                                    <br />
                                    <span className="text-red-500">이 작업은 되돌릴 수 없습니다.</span>
                                </>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
                            삭제
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
