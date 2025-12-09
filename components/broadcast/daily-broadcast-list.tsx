"use client"

import { useEffect, useMemo, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { useBroadcastStore, DailySummary } from "@/store/broadcast"
import { useBroadcastTabStore } from "@/store/broadcast-tab-store"
import { StatusBadge } from "./status-indicator"
import { SimplePagination, usePagination } from "@/components/ui/simple-pagination"
import { Search, Radio, Satellite, Clock } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface DailyBroadcastListProps {
    onNewClick?: () => void
}

// 분을 시간:분 형식으로 변환
function formatDuration(minutes: number): string {
    if (minutes === 0) return '-'
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    if (hours === 0) return `${mins}분`
    if (mins === 0) return `${hours}시간`
    return `${hours}시간 ${mins}분`
}

export function DailyBroadcastList({ onNewClick }: DailyBroadcastListProps) {
    const router = useRouter()
    const schedules = useBroadcastStore((state) => state.schedules)
    const loading = useBroadcastStore((state) => state.loading)
    const fetchSchedules = useBroadcastStore((state) => state.fetchSchedules)
    const getDailySummaries = useBroadcastStore((state) => state.getDailySummaries)
    const { addTab } = useBroadcastTabStore()

    const [searchQuery, setSearchQuery] = useState("")
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedIndex, setSelectedIndex] = useState<number>(-1)
    const tableRef = useRef<HTMLTableElement>(null)
    const ITEMS_PER_PAGE = 10

    useEffect(() => {
        fetchSchedules()
    }, [fetchSchedules])

    // 일단위 요약 데이터
    const dailySummaries = useMemo(() => {
        return getDailySummaries()
    }, [getDailySummaries, schedules])

    // 검색 필터
    const filteredSummaries = useMemo(() => {
        if (!searchQuery.trim()) return dailySummaries

        const query = searchQuery.toLowerCase()
        return dailySummaries.filter(summary =>
            summary.date.includes(query) ||
            summary.displayDate.toLowerCase().includes(query) ||
            summary.topPrograms.some(p => p.toLowerCase().includes(query))
        )
    }, [dailySummaries, searchQuery])

    // 검색어 변경 시 선택 및 페이지 초기화
    useEffect(() => {
        setSelectedIndex(-1)
        setCurrentPage(1)
    }, [searchQuery])

    // 페이지네이션 훅 사용
    const { totalPages, getPageItems } = usePagination(filteredSummaries, ITEMS_PER_PAGE)
    const currentItems = getPageItems(currentPage)

    const handleRowClick = useCallback((summary: DailySummary, index?: number) => {
        if (index !== undefined) {
            setSelectedIndex(index)
        }
        addTab({
            id: summary.date,
            title: format(new Date(summary.date + 'T00:00:00'), 'MM/dd (EEE)', { locale: ko }),
            date: summary.date
        })
        router.push(`/broadcasts?date=${summary.date}`)
    }, [addTab, router])

    // 키보드 네비게이션
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (currentItems.length === 0) return

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault()
                    setSelectedIndex(prev =>
                        prev < currentItems.length - 1 ? prev + 1 : prev
                    )
                    break
                case 'ArrowUp':
                    e.preventDefault()
                    setSelectedIndex(prev => prev > 0 ? prev - 1 : 0)
                    break
                case 'Enter':
                    if (selectedIndex >= 0 && selectedIndex < currentItems.length) {
                        handleRowClick(currentItems[selectedIndex], selectedIndex)
                    }
                    break
                case 'ArrowLeft':
                    if (currentPage > 1) setCurrentPage(prev => prev - 1)
                    break
                case 'ArrowRight':
                    if (currentPage < totalPages) setCurrentPage(prev => prev + 1)
                    break
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [currentItems, selectedIndex, handleRowClick, currentPage, totalPages])

    return (
        <div className="space-y-6">
            <Card className="rounded-tl-none shadow-none border-t-0">
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="날짜, 프로그램 검색..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="text-sm text-muted-foreground">
                            총 {dailySummaries.length}일
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                        </div>
                    ) : filteredSummaries.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            등록된 중계 일정이 없습니다.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[120px]">날짜</TableHead>
                                    <TableHead className="w-[150px]">
                                        <div className="flex items-center gap-1">
                                            <Radio className="h-4 w-4 text-red-500" />
                                            라이브
                                        </div>
                                    </TableHead>
                                    <TableHead className="w-[150px]">
                                        <div className="flex items-center gap-1">
                                            <Satellite className="h-4 w-4 text-blue-500" />
                                            수신
                                        </div>
                                    </TableHead>
                                    <TableHead>주요내용</TableHead>
                                    <TableHead className="w-[180px]">
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            중계/수신 시간
                                        </div>
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentItems.map((summary, index) => (
                                    <TableRow
                                        key={summary.date}
                                        className={cn(
                                            "cursor-pointer transition-colors",
                                            "hover:bg-gray-100",
                                            selectedIndex === index && "bg-gray-100 hover:bg-gray-100",
                                            summary.hasLiveNow && selectedIndex !== index && "bg-green-50 hover:bg-green-100"
                                        )}
                                        onClick={() => handleRowClick(summary, index)}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                    >
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {summary.hasLiveNow && (
                                                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                                )}
                                                {summary.displayDate}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{summary.liveCount}건</span>
                                                {summary.liveCompletedCount > 0 && (
                                                    <StatusBadge status="completed" count={summary.liveCompletedCount} />
                                                )}
                                                {summary.hasLiveNow && (
                                                    <StatusBadge status="live" count={summary.liveCount - summary.liveCompletedCount} />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{summary.receptionCount}건</span>
                                                {summary.receptionCompletedCount > 0 && (
                                                    <StatusBadge status="completed" count={summary.receptionCompletedCount} />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm text-muted-foreground truncate max-w-[300px]">
                                                {summary.topPrograms.length > 0
                                                    ? summary.topPrograms.join(', ') + (summary.liveCount + summary.receptionCount > 3 ? ' 외' : '')
                                                    : '-'
                                                }
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm space-y-0.5">
                                                <div className="flex items-center gap-1">
                                                    <span className="text-red-600">중계</span>
                                                    <span>{formatDuration(summary.liveDuration)}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="text-blue-600">수신</span>
                                                    <span>{formatDuration(summary.receptionDuration)}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <SimplePagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />
        </div>
    )
}
