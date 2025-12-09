"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { BroadcastSchedule, BroadcastStatus } from "@/store/broadcast"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface BroadcastTimelineProps {
    schedules: BroadcastSchedule[]
    startHour?: number
    endHour?: number
}

const statusColors: Record<BroadcastStatus, string> = {
    scheduled: 'bg-gray-400',
    standby: 'bg-yellow-400',
    live: 'bg-green-500',
    completed: 'bg-blue-500',
    issue: 'bg-red-500'
}

export function BroadcastTimeline({
    schedules,
    startHour = 6,
    endHour = 24
}: BroadcastTimelineProps) {
    const totalMinutes = (endHour - startHour) * 60

    // 시간 마커 생성 (6시간 간격)
    const hourMarkers = useMemo(() => {
        const markers = []
        for (let h = startHour; h <= endHour; h += 6) {
            markers.push(h)
        }
        return markers
    }, [startHour, endHour])

    // 스케줄 위치 계산
    const schedulesWithPosition = useMemo(() => {
        return schedules.map(schedule => {
            const [hours, minutes] = schedule.time.split(':').map(Number)
            const scheduleMinutes = hours * 60 + minutes
            const startMinutes = startHour * 60
            const position = ((scheduleMinutes - startMinutes) / totalMinutes) * 100

            return {
                ...schedule,
                position: Math.max(0, Math.min(100, position))
            }
        }).filter(s => s.position >= 0 && s.position <= 100)
    }, [schedules, startHour, totalMinutes])

    // 현재 시간 위치
    const currentTimePosition = useMemo(() => {
        const now = new Date()
        const currentMinutes = now.getHours() * 60 + now.getMinutes()
        const startMinutes = startHour * 60
        const endMinutes = endHour * 60

        if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
            return null
        }

        return ((currentMinutes - startMinutes) / totalMinutes) * 100
    }, [startHour, endHour, totalMinutes])

    return (
        <TooltipProvider>
            <div className="w-full">
                {/* 타임라인 바 */}
                <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                    {/* 시간 눈금 */}
                    {hourMarkers.map(hour => {
                        const position = ((hour - startHour) / (endHour - startHour)) * 100
                        return (
                            <div
                                key={hour}
                                className="absolute top-0 bottom-0 w-px bg-gray-300"
                                style={{ left: `${position}%` }}
                            />
                        )
                    })}

                    {/* 현재 시간 표시 */}
                    {currentTimePosition !== null && (
                        <div
                            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                            style={{ left: `${currentTimePosition}%` }}
                        >
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full" />
                        </div>
                    )}

                    {/* 스케줄 마커 */}
                    {schedulesWithPosition.map((schedule, index) => {
                        const status = schedule.status || 'scheduled'
                        return (
                            <Tooltip key={schedule.id}>
                                <TooltipTrigger asChild>
                                    <div
                                        className={cn(
                                            "absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full cursor-pointer",
                                            "hover:scale-125 transition-transform z-10",
                                            statusColors[status],
                                            status === 'live' && 'animate-pulse'
                                        )}
                                        style={{ left: `calc(${schedule.position}% - 6px)` }}
                                    />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <div className="text-sm">
                                        <div className="font-semibold">{schedule.time} {schedule.program_title}</div>
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
                <div className="relative h-5 mt-1">
                    {hourMarkers.map(hour => {
                        const position = ((hour - startHour) / (endHour - startHour)) * 100
                        return (
                            <div
                                key={hour}
                                className="absolute text-xs text-muted-foreground transform -translate-x-1/2"
                                style={{ left: `${position}%` }}
                            >
                                {hour.toString().padStart(2, '0')}:00
                            </div>
                        )
                    })}
                </div>
            </div>
        </TooltipProvider>
    )
}
