"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams } from "next/navigation"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { useBroadcastStore, BroadcastSchedule } from "@/store/broadcast"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Phone, RefreshCw, Maximize, Minimize, X } from "lucide-react"

export default function BroadcastMonitorPage() {
    const params = useParams()
    const date = params.id as string

    const schedules = useBroadcastStore((state) => state.schedules)
    const loading = useBroadcastStore((state) => state.loading)
    const fetchSchedules = useBroadcastStore((state) => state.fetchSchedules)

    const [lastRefresh, setLastRefresh] = useState(new Date())
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [globalDismissed, setGlobalDismissed] = useState(false)

    // Global keyboard handler for ON AIR alerts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // R key: Reset (re-enable ON AIR alerts)
            if (e.key === 'r' || e.key === 'R') {
                e.preventDefault()
                setGlobalDismissed(false)
                return
            }
            // Space bar: Dismiss all ON AIR alerts
            if (e.key === ' ') {
                e.preventDefault()
                setGlobalDismissed(true)
                return
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Fullscreen change listener
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement)
        }
        document.addEventListener('fullscreenchange', handleFullscreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }, [])

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen()
        } else {
            document.exitFullscreen()
        }
    }

    const handleClose = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen()
        }
        window.close()
    }

    // Initial fetch
    useEffect(() => {
        if (date) {
            fetchSchedules(date)
        }
    }, [date, fetchSchedules])

    // Auto refresh every 60 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            if (date) {
                fetchSchedules(date)
                setLastRefresh(new Date())
            }
        }, 60000)

        return () => clearInterval(interval)
    }, [date, fetchSchedules])

    const broadcasts = schedules.filter(s => s.date === date && s.type === 'broadcast')
    const receptions = schedules.filter(s => s.date === date && s.type === 'reception')

    const dateObj = date ? new Date(date + 'T00:00:00') : new Date()

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
            {/* Header */}
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">
                        {format(dateObj, 'yyyy년 MM월 dd일 EEEE', { locale: ko })}
                    </h1>
                    <p className="text-slate-400 text-lg mt-1">MBC플러스 중계현황</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-slate-400">
                        <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                        <span className="text-sm" suppressHydrationWarning>
                            마지막 갱신: {format(lastRefresh, 'HH:mm:ss')}
                        </span>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleFullscreen}
                        className="bg-slate-700 border-slate-600 hover:bg-slate-600 text-white"
                    >
                        {isFullscreen ? (
                            <><Minimize className="h-4 w-4 mr-2" />전체화면 해제</>
                        ) : (
                            <><Maximize className="h-4 w-4 mr-2" />전체화면</>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClose}
                        className="bg-slate-700 border-slate-600 hover:bg-red-600 text-white"
                    >
                        <X className="h-4 w-4 mr-2" />닫기
                    </Button>
                </div>
            </header>

            <div className="grid lg:grid-cols-9 gap-8">
                {/* LIVE Section - 5/9 */}
                <section className="lg:col-span-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-8 w-2 bg-red-500 rounded-full animate-pulse"></div>
                        <h2 className="text-2xl font-bold">TITAN LIVE ON</h2>
                        <Badge className="bg-red-600 text-white text-lg px-3 py-1">{broadcasts.length}건</Badge>
                    </div>

                    <div className="space-y-4">
                        {broadcasts.length === 0 ? (
                            <div className="text-center py-12 text-slate-500 bg-slate-800/50 rounded-xl border border-slate-700">
                                예정된 중계가 없습니다
                            </div>
                        ) : (
                            broadcasts.map(schedule => (
                                <MonitorCard key={schedule.id} schedule={schedule} type="live" globalDismissed={globalDismissed} />
                            ))
                        )}
                    </div>
                </section>

                {/* Reception Section - 4/9 */}
                <section className="lg:col-span-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-8 w-2 bg-blue-500 rounded-full"></div>
                        <h2 className="text-2xl font-bold">수신 현황</h2>
                        <Badge className="bg-blue-600 text-white text-lg px-3 py-1">{receptions.length}건</Badge>
                    </div>

                    <div className="space-y-4">
                        {receptions.length === 0 ? (
                            <div className="text-center py-12 text-slate-500 bg-slate-800/50 rounded-xl border border-slate-700">
                                예정된 수신이 없습니다
                            </div>
                        ) : (
                            receptions.map(schedule => (
                                <MonitorCard key={schedule.id} schedule={schedule} type="reception" globalDismissed={globalDismissed} />
                            ))
                        )}
                    </div>
                </section>
            </div>

            <footer className="fixed bottom-4 left-0 right-0 text-center text-slate-500 text-sm">
                자동 갱신 (60초) | <span className="text-yellow-400">Space</span>: ON AIR 해제 | <span className="text-green-400">R</span>: ON AIR 다시 활성화
            </footer>
        </div>
    )
}

function MonitorCard({ schedule, type, globalDismissed }: { schedule: BroadcastSchedule; type: 'live' | 'reception'; globalDismissed: boolean }) {
    const [currentTime, setCurrentTime] = useState(new Date())

    // Update current time every second
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    // Check if broadcast is starting (within 5 minutes before or during)
    const isOnAir = useMemo(() => {
        const scheduleTime = schedule.time.slice(0, 5) // "HH:MM"
        const [hours, minutes] = scheduleTime.split(':').map(Number)
        const scheduleDate = new Date(schedule.date + 'T00:00:00')
        scheduleDate.setHours(hours, minutes, 0, 0)

        const diff = (currentTime.getTime() - scheduleDate.getTime()) / 1000 / 60 // in minutes
        // Alert from 5 minutes before to 30 minutes after start
        return diff >= -5 && diff <= 30
    }, [schedule.time, schedule.date, currentTime])

    const borderColor = type === 'live' ? 'border-red-500/30' : 'border-blue-500/30'
    const timeColor = type === 'live' ? 'text-red-400' : 'text-blue-400'
    const blinkClass = isOnAir && !globalDismissed ? 'animate-pulse ring-4 ring-yellow-400/50 shadow-lg shadow-yellow-400/30' : ''

    return (
        <div className={`bg-slate-800/70 backdrop-blur rounded-xl p-5 border ${borderColor} hover:bg-slate-800 transition-colors ${blinkClass} relative`}>
            {isOnAir && !globalDismissed && (
                <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded animate-bounce">
                    ON AIR
                </div>
            )}
            <div className="flex gap-5 relative">
                {/* Time & Channel */}
                <div className="flex flex-col items-center min-w-[100px]">
                    <div className="flex items-baseline gap-1">
                        <span className={`text-3xl font-bold ${timeColor}`}>
                            {schedule.time.slice(0, 5)}
                        </span>
                        {schedule.end_time && (
                            <span className="text-xl text-slate-400">~{schedule.end_time.slice(0, 5)}</span>
                        )}
                    </div>
                    <span className="text-xl font-bold text-yellow-400 mt-1">
                        {schedule.channel_name}
                    </span>
                    {schedule.studio_label && (
                        <Badge className="mt-2 bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                            {schedule.studio_label}
                        </Badge>
                    )}
                </div>

                {/* Program Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold text-white truncate">
                        {schedule.program_title}
                    </h3>
                    {schedule.match_info && (
                        <p className="text-lg text-slate-300 mt-1">
                            &lt;{schedule.match_info}&gt;
                        </p>
                    )}
                    {schedule.broadcast_van && (
                        <p className="text-green-400 font-medium mt-2">
                            중계차: {schedule.broadcast_van}
                        </p>
                    )}
                    {schedule.memo && (
                        <p className="text-red-400 font-bold mt-2 text-sm">
                            {schedule.memo}
                        </p>
                    )}
                </div>

                {/* Technical Info */}
                <div className="flex flex-col gap-1 text-sm min-w-[200px]">
                    {schedule.transmission_path && (
                        <div className="text-blue-300">수신: {schedule.transmission_path}</div>
                    )}
                    {schedule.video_source_info && (
                        <div className="text-green-300">송신: {schedule.video_source_info}</div>
                    )}
                    {schedule.return_info && (
                        <div className="text-purple-300">리턴: {schedule.return_info}</div>
                    )}
                    {schedule.hq_network && (
                        <div className="text-purple-300">본사망: {schedule.hq_network}</div>
                    )}
                    {schedule.biss_code && (
                        <div className="font-mono text-slate-400">BISS: {schedule.biss_code}</div>
                    )}
                    {(schedule.manager || schedule.contact_info) && (
                        <div className="flex items-center gap-1 text-cyan-300 mt-2">
                            <Phone className="h-3 w-3" />
                            {schedule.manager}
                            {schedule.contact_info && (
                                <span className="text-slate-400">({schedule.contact_info})</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
