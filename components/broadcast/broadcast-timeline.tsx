"use client"

import { useMemo, useEffect, useState, useRef, useCallback } from "react"
import { cn } from "@/lib/utils"
import { BroadcastSchedule, BroadcastStatus } from "@/store/broadcast"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BroadcastTimelineProps {
    schedules: BroadcastSchedule[]
    shiftType?: 'day' | 'night'
}

const statusColors: Record<BroadcastStatus, string> = {
    scheduled: 'bg-gray-400 border-gray-500',
    standby: 'bg-yellow-400 border-yellow-500',
    live: 'bg-green-500 border-green-600',
    completed: 'bg-blue-500 border-blue-600',
    issue: 'bg-red-500 border-red-600'
}

const statusLabels: Record<BroadcastStatus, string> = {
    scheduled: '예정',
    standby: '대기',
    live: 'LIVE',
    completed: '완료',
    issue: '이슈'
}

// 시간을 표시용 문자열로 변환 (24시간 넘으면 "익일" 표시)
const formatHourLabel = (hour: number): string => {
    const displayHour = hour >= 24 ? hour - 24 : hour
    const prefix = hour >= 24 ? '익일 ' : ''
    return `${prefix}${Math.floor(displayHour).toString().padStart(2, '0')}:${((displayHour % 1) * 60).toString().padStart(2, '0').slice(0, 2)}`
}

// 시간을 짧은 형식으로 변환
const formatHourShort = (hour: number): string => {
    const displayHour = hour >= 24 ? hour - 24 : hour
    return `${Math.floor(displayHour).toString().padStart(2, '0')}:00`
}

export function BroadcastTimeline({
    schedules,
    shiftType = 'night'
}: BroadcastTimelineProps) {
    const [currentTime, setCurrentTime] = useState(new Date())

    // 근무 타입에 따른 타임라인 범위 설정
    // 주간: 07:30 ~ 18:30 (11시간)
    // 야간: 18:30 ~ 익일 07:30 (13시간, 24+7.5=31.5로 표현)
    const timelineConfig = useMemo(() => {
        if (shiftType === 'day') {
            return {
                startHour: 7.5,    // 07:30
                endHour: 18.5,     // 18:30
                workStart: 7.5,
                workEnd: 18.5
            }
        } else {
            return {
                startHour: 18.5,   // 18:30
                endHour: 31.5,     // 익일 07:30 (24 + 7.5)
                workStart: 18.5,
                workEnd: 31.5
            }
        }
    }, [shiftType])

    const { startHour, endHour, workStart, workEnd } = timelineConfig

    // 뷰 범위 상태 (확대/축소용)
    const [viewStart, setViewStart] = useState(startHour)
    const [viewEnd, setViewEnd] = useState(endHour)

    // 근무 타입 변경 시 뷰 리셋
    useEffect(() => {
        setViewStart(startHour)
        setViewEnd(endHour)
    }, [shiftType, startHour, endHour])

    // 드래그 상태
    const [isDragging, setIsDragging] = useState<'start' | 'end' | 'range' | 'timeline' | null>(null)
    const [dragStartX, setDragStartX] = useState(0)
    const [dragStartValues, setDragStartValues] = useState({ start: startHour, end: endHour })
    const rangeBarRef = useRef<HTMLDivElement>(null)
    const timelineRef = useRef<HTMLDivElement>(null)

    const totalRange = endHour - startHour
    const viewRange = viewEnd - viewStart

    // 1분마다 현재 시간 업데이트
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date())
        }, 60000)
        return () => clearInterval(interval)
    }, [])

    // 현재 시간을 타임라인 시간으로 변환
    const getCurrentTimelineHour = useCallback(() => {
        const hours = currentTime.getHours()
        const minutes = currentTime.getMinutes()
        let timelineHour = hours + minutes / 60

        // 야간 근무일 때, 자정 이후(00:00~07:30)는 24를 더해서 표현
        if (shiftType === 'night' && hours < 7.5) {
            timelineHour += 24
        }
        // 야간 근무일 때, 07:30 이전 시간대인데 18:30 이전이면 범위 밖
        if (shiftType === 'night' && hours >= 7.5 && hours < 18.5) {
            return null // 범위 밖
        }

        return timelineHour
    }, [currentTime, shiftType])

    // 시간 마커 생성 (뷰 범위에 따라 간격 조절)
    const hourMarkers = useMemo(() => {
        const markers = []
        const interval = viewRange <= 6 ? 1 : viewRange <= 12 ? 2 : 3
        const firstMarker = Math.ceil(viewStart / interval) * interval
        for (let h = firstMarker; h <= viewEnd; h += interval) {
            markers.push(h)
        }
        return markers
    }, [viewStart, viewEnd, viewRange])

    // 업무시간대 위치 계산
    const workHoursPosition = useMemo(() => {
        const startPos = ((Math.max(workStart, viewStart) - viewStart) / viewRange) * 100
        const endPos = ((Math.min(workEnd, viewEnd) - viewStart) / viewRange) * 100
        if (workEnd < viewStart || workStart > viewEnd) {
            return { start: 0, width: 0 }
        }
        return { start: Math.max(0, startPos), width: Math.max(0, endPos - startPos) }
    }, [viewStart, viewEnd, viewRange, workStart, workEnd])

    // 스케줄 위치 계산
    const schedulesWithPosition = useMemo(() => {
        return schedules.map(schedule => {
            const [hours, minutes] = schedule.time.split(':').map(Number)
            let scheduleHour = hours + minutes / 60

            // 야간 근무일 때, 자정 이후 스케줄은 24를 더함
            if (shiftType === 'night' && hours < 12) {
                scheduleHour += 24
            }

            const position = ((scheduleHour - viewStart) / viewRange) * 100

            return {
                ...schedule,
                position: Math.max(0, Math.min(100, position)),
                visible: scheduleHour >= viewStart && scheduleHour <= viewEnd
            }
        }).filter(s => s.visible)
    }, [schedules, viewStart, viewEnd, viewRange, shiftType])

    // 현재 시간 위치 및 포맷
    const currentTimeData = useMemo(() => {
        const timelineHour = getCurrentTimelineHour()

        if (timelineHour === null || timelineHour < viewStart || timelineHour > viewEnd) {
            return null
        }

        const position = ((timelineHour - viewStart) / viewRange) * 100
        const timeLabel = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`

        return { position, timeLabel }
    }, [currentTime, viewStart, viewEnd, viewRange, getCurrentTimelineHour])

    // 미니맵에서의 스케줄 위치
    const minimapSchedules = useMemo(() => {
        return schedules.map(schedule => {
            const [hours, minutes] = schedule.time.split(':').map(Number)
            let scheduleHour = hours + minutes / 60

            if (shiftType === 'night' && hours < 12) {
                scheduleHour += 24
            }

            const position = ((scheduleHour - startHour) / totalRange) * 100
            return { ...schedule, position }
        }).filter(s => s.position >= 0 && s.position <= 100)
    }, [schedules, startHour, totalRange, shiftType])

    // 타임라인 드래그 핸들러 (좌우 이동)
    const handleTimelineMouseDown = useCallback((e: React.MouseEvent) => {
        // 스케줄 마커 클릭은 무시
        if ((e.target as HTMLElement).closest('[data-schedule-marker]')) return

        e.preventDefault()
        setIsDragging('timeline')
        setDragStartX(e.clientX)
        setDragStartValues({ start: viewStart, end: viewEnd })
    }, [viewStart, viewEnd])

    // 미니맵 드래그 핸들러
    const handleMouseDown = useCallback((type: 'start' | 'end' | 'range', e: React.MouseEvent) => {
        e.preventDefault()
        setIsDragging(type)
        setDragStartX(e.clientX)
        setDragStartValues({ start: viewStart, end: viewEnd })
    }, [viewStart, viewEnd])

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging) return

        const minRange = 2 // 최소 2시간

        if (isDragging === 'timeline' && timelineRef.current) {
            const rect = timelineRef.current.getBoundingClientRect()
            const deltaX = e.clientX - dragStartX
            // 드래그 방향 반전: 오른쪽으로 드래그하면 과거로, 왼쪽으로 드래그하면 미래로
            const deltaHours = -(deltaX / rect.width) * viewRange

            const currentRange = dragStartValues.end - dragStartValues.start
            let newStart = dragStartValues.start + deltaHours
            let newEnd = dragStartValues.end + deltaHours

            if (newStart < startHour) {
                newStart = startHour
                newEnd = startHour + currentRange
            }
            if (newEnd > endHour) {
                newEnd = endHour
                newStart = endHour - currentRange
            }

            setViewStart(Math.round(newStart * 2) / 2)
            setViewEnd(Math.round(newEnd * 2) / 2)
        } else if (rangeBarRef.current) {
            const rect = rangeBarRef.current.getBoundingClientRect()
            const deltaX = e.clientX - dragStartX
            const deltaHours = (deltaX / rect.width) * totalRange

            if (isDragging === 'start') {
                const newStart = Math.max(startHour, Math.min(dragStartValues.start + deltaHours, viewEnd - minRange))
                setViewStart(Math.round(newStart * 2) / 2)
            } else if (isDragging === 'end') {
                const newEnd = Math.min(endHour, Math.max(dragStartValues.end + deltaHours, viewStart + minRange))
                setViewEnd(Math.round(newEnd * 2) / 2)
            } else if (isDragging === 'range') {
                const currentRange = dragStartValues.end - dragStartValues.start
                let newStart = dragStartValues.start + deltaHours
                let newEnd = dragStartValues.end + deltaHours

                if (newStart < startHour) {
                    newStart = startHour
                    newEnd = startHour + currentRange
                }
                if (newEnd > endHour) {
                    newEnd = endHour
                    newStart = endHour - currentRange
                }

                setViewStart(Math.round(newStart * 2) / 2)
                setViewEnd(Math.round(newEnd * 2) / 2)
            }
        }
    }, [isDragging, dragStartX, dragStartValues, startHour, endHour, totalRange, viewStart, viewEnd, viewRange])

    const handleMouseUp = useCallback(() => {
        setIsDragging(null)
    }, [])

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
            return () => {
                window.removeEventListener('mousemove', handleMouseMove)
                window.removeEventListener('mouseup', handleMouseUp)
            }
        }
    }, [isDragging, handleMouseMove, handleMouseUp])

    // 확대/축소 버튼 핸들러
    const handleZoomIn = () => {
        const center = (viewStart + viewEnd) / 2
        const newRange = Math.max(2, viewRange * 0.6)
        const newStart = Math.max(startHour, center - newRange / 2)
        const newEnd = Math.min(endHour, center + newRange / 2)
        setViewStart(Math.round(newStart * 2) / 2)
        setViewEnd(Math.round(newEnd * 2) / 2)
    }

    const handleZoomOut = () => {
        const center = (viewStart + viewEnd) / 2
        const newRange = Math.min(totalRange, viewRange * 1.5)
        let newStart = center - newRange / 2
        let newEnd = center + newRange / 2

        if (newStart < startHour) {
            newStart = startHour
            newEnd = Math.min(endHour, startHour + newRange)
        }
        if (newEnd > endHour) {
            newEnd = endHour
            newStart = Math.max(startHour, endHour - newRange)
        }

        setViewStart(Math.round(newStart * 2) / 2)
        setViewEnd(Math.round(newEnd * 2) / 2)
    }

    const handleReset = () => {
        setViewStart(startHour)
        setViewEnd(endHour)
    }

    // 뷰포트 위치 (미니맵용)
    const viewportPosition = useMemo(() => ({
        left: ((viewStart - startHour) / totalRange) * 100,
        width: (viewRange / totalRange) * 100
    }), [viewStart, viewRange, startHour, totalRange])

    return (
        <TooltipProvider>
            <div className="w-full space-y-2">
                {/* 메인 타임라인 바 */}
                <div
                    ref={timelineRef}
                    className={cn(
                        "relative h-12 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-visible",
                        isDragging === 'timeline' ? "cursor-grabbing" : "cursor-grab"
                    )}
                    onMouseDown={handleTimelineMouseDown}
                >
                    {/* 업무시간대 강조 배경 */}
                    {workHoursPosition.width > 0 && (
                        <div
                            className="absolute top-0 bottom-0 bg-indigo-100 dark:bg-indigo-900/40 border-l-2 border-r-2 border-indigo-300 dark:border-indigo-600"
                            style={{
                                left: `${workHoursPosition.start}%`,
                                width: `${workHoursPosition.width}%`
                            }}
                        />
                    )}

                    {/* 자정 구분선 (야간 근무 시) */}
                    {shiftType === 'night' && viewStart < 24 && viewEnd > 24 && (
                        <div
                            className="absolute top-0 bottom-0 w-0.5 bg-orange-400 dark:bg-orange-500 z-5"
                            style={{ left: `${((24 - viewStart) / viewRange) * 100}%` }}
                        >
                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-1 py-0.5 bg-orange-400 text-white text-[9px] font-medium rounded whitespace-nowrap">
                                자정
                            </div>
                        </div>
                    )}

                    {/* 시간 눈금 */}
                    {hourMarkers.map(hour => {
                        const position = ((hour - viewStart) / viewRange) * 100
                        return (
                            <div
                                key={hour}
                                className="absolute top-0 bottom-0 w-px bg-gray-300 dark:bg-gray-600"
                                style={{ left: `${position}%` }}
                            />
                        )
                    })}

                    {/* 현재 시간 표시 */}
                    {currentTimeData !== null && (
                        <div
                            className="absolute top-0 bottom-0 z-30"
                            style={{ left: `${currentTimeData.position}%` }}
                        >
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-semibold rounded shadow-sm whitespace-nowrap">
                                {currentTimeData.timeLabel}
                            </div>
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-red-500" />
                            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-1 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-r-[5px] border-b-[6px] border-l-transparent border-r-transparent border-b-red-500" />
                        </div>
                    )}

                    {/* 스케줄 마커 */}
                    {schedulesWithPosition.map((schedule) => {
                        const status = schedule.status || 'scheduled'
                        return (
                            <Tooltip key={schedule.id}>
                                <TooltipTrigger asChild>
                                    <div
                                        data-schedule-marker
                                        className={cn(
                                            "absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full cursor-pointer",
                                            "border-2 border-white dark:border-gray-900 shadow-md",
                                            "hover:scale-125 hover:shadow-lg transition-all z-10",
                                            statusColors[status],
                                            status === 'live' && 'animate-pulse ring-2 ring-green-400 ring-opacity-50'
                                        )}
                                        style={{ left: `calc(${schedule.position}% - 8px)` }}
                                    >
                                        {status === 'live' && (
                                            <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-bold text-green-600 dark:text-green-400 whitespace-nowrap">
                                                LIVE
                                            </span>
                                        )}
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <div className="text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "px-1.5 py-0.5 rounded text-[10px] font-medium text-white",
                                                status === 'scheduled' && 'bg-gray-500',
                                                status === 'standby' && 'bg-yellow-500',
                                                status === 'live' && 'bg-green-500',
                                                status === 'completed' && 'bg-blue-500',
                                                status === 'issue' && 'bg-red-500'
                                            )}>
                                                {statusLabels[status]}
                                            </span>
                                            <span className="font-semibold">{schedule.time}</span>
                                        </div>
                                        <div className="font-medium mt-1">{schedule.program_title}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {schedule.channel_name || '채널 미지정'}
                                            {schedule.type === 'broadcast' ? ' [라이브]' : ' [수신]'}
                                        </div>
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        )
                    })}
                </div>

                {/* 시간 라벨 */}
                <div className="relative h-5">
                    {hourMarkers.map(hour => {
                        const position = ((hour - viewStart) / viewRange) * 100
                        const isNextDay = hour >= 24
                        return (
                            <div
                                key={hour}
                                className={cn(
                                    "absolute transform -translate-x-1/2 text-[11px]",
                                    isNextDay ? "text-orange-600 dark:text-orange-400 font-medium" : "text-muted-foreground"
                                )}
                                style={{ left: `${position}%` }}
                            >
                                {formatHourShort(hour)}
                            </div>
                        )
                    })}
                </div>

                {/* 하단 컨트롤 바 */}
                <div className="flex items-center gap-2 pt-1">
                    {/* 줌 버튼 */}
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={handleZoomIn}
                            disabled={viewRange <= 2}
                        >
                            <ZoomIn className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={handleZoomOut}
                            disabled={viewRange >= totalRange}
                        >
                            <ZoomOut className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={handleReset}
                            disabled={viewStart === startHour && viewEnd === endHour}
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                        </Button>
                    </div>

                    {/* 미니맵 범위 선택기 */}
                    <div
                        ref={rangeBarRef}
                        className="flex-1 relative h-4 bg-gray-200 dark:bg-gray-700 rounded cursor-pointer"
                    >
                        {/* 자정 표시 (야간 근무 시) */}
                        {shiftType === 'night' && (
                            <div
                                className="absolute top-0 bottom-0 w-0.5 bg-orange-300 dark:bg-orange-600"
                                style={{ left: `${((24 - startHour) / totalRange) * 100}%` }}
                            />
                        )}

                        {/* 미니맵 스케줄 표시 */}
                        {minimapSchedules.map((schedule) => (
                            <div
                                key={schedule.id}
                                className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-gray-500 dark:bg-gray-400"
                                style={{ left: `${schedule.position}%` }}
                            />
                        ))}

                        {/* 선택 영역 */}
                        <div
                            className="absolute top-0 bottom-0 bg-primary/20 border border-primary/40 rounded cursor-move"
                            style={{
                                left: `${viewportPosition.left}%`,
                                width: `${viewportPosition.width}%`
                            }}
                            onMouseDown={(e) => handleMouseDown('range', e)}
                        >
                            {/* 왼쪽 핸들 */}
                            <div
                                className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-primary/30 rounded-l"
                                onMouseDown={(e) => { e.stopPropagation(); handleMouseDown('start', e) }}
                            />
                            {/* 오른쪽 핸들 */}
                            <div
                                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-primary/30 rounded-r"
                                onMouseDown={(e) => { e.stopPropagation(); handleMouseDown('end', e) }}
                            />
                        </div>

                        {/* 미니맵 시간 라벨 */}
                        <div className="absolute -bottom-4 left-0 text-[9px] text-muted-foreground">
                            {formatHourLabel(startHour)}
                        </div>
                        <div className="absolute -bottom-4 right-0 text-[9px] text-muted-foreground">
                            {formatHourLabel(endHour)}
                        </div>
                    </div>

                    {/* 현재 범위 표시 */}
                    <div className="text-[10px] text-muted-foreground whitespace-nowrap min-w-[100px] text-right">
                        {formatHourLabel(viewStart)} ~ {formatHourLabel(viewEnd)}
                    </div>
                </div>
            </div>
        </TooltipProvider>
    )
}
