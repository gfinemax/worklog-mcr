"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { MainLayout } from "@/components/layout/main-layout"

interface BroadcastSchedule {
    id: string
    type: 'broadcast' | 'reception'
    date: string
    time: string
    channel_name: string
    program_title: string
    studio_label?: string
    match_info?: string
    memo?: string
    transmission_path?: string
    video_source_info?: string
    audio_source_info?: string
    contact_info?: string
    created_at: string
}

export default function TodayBroadcastsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [schedules, setSchedules] = useState<BroadcastSchedule[]>([])
    const [date, setDate] = useState(new Date())

    useEffect(() => {
        const fetchSchedules = async () => {
            setLoading(true)
            const dateStr = format(date, 'yyyy-MM-dd')

            const { data, error } = await supabase
                .from('broadcast_schedules')
                .select('*')
                .eq('date', dateStr)
                .order('time', { ascending: true })

            if (error) {
                console.error('Error fetching schedules:', error)
            } else {
                setSchedules(data || [])
            }
            setLoading(false)
        }

        fetchSchedules()
    }, [date])

    const broadcasts = schedules.filter(s => s.type === 'broadcast')
    const receptions = schedules.filter(s => s.type === 'reception')

    return (
        <MainLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">오늘 중계현황 ({format(date, 'MM월 dd일 EEEE', { locale: ko })})</h1>
                    <div className="flex gap-2">
                        {/* Date picker could go here */}
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-8">
                        {/* Broadcast Section */}
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="h-6 w-1 bg-red-600 rounded-full"></div>
                                <h2 className="text-xl font-bold text-gray-800">중계 현황</h2>
                            </div>

                            <div className="grid gap-4">
                                {broadcasts.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                        예정된 중계 일정이 없습니다.
                                    </div>
                                ) : (
                                    broadcasts.map(schedule => (
                                        <BroadcastCard key={schedule.id} schedule={schedule} onClick={() => router.push(`/broadcasts/${schedule.id}/monitor`)} />
                                    ))
                                )}
                            </div>
                        </section>

                        <div className="border-t border-gray-200 my-8"></div>

                        {/* Reception Section */}
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="h-6 w-1 bg-blue-600 rounded-full"></div>
                                <h2 className="text-xl font-bold text-gray-800">수신 현황</h2>
                            </div>

                            <div className="grid gap-4">
                                {receptions.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                        예정된 수신 일정이 없습니다.
                                    </div>
                                ) : (
                                    receptions.map(schedule => (
                                        <BroadcastCard key={schedule.id} schedule={schedule} onClick={() => router.push(`/broadcasts/${schedule.id}/monitor`)} />
                                    ))
                                )}
                            </div>
                        </section>
                    </div>
                )}
            </div>
        </MainLayout>
    )
}

function BroadcastCard({ schedule, onClick }: { schedule: BroadcastSchedule, onClick: () => void }) {
    return (
        <div
            onClick={onClick}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer flex flex-col md:flex-row gap-4 items-start md:items-center"
        >
            {/* Time & Channel */}
            <div className="flex flex-col min-w-[120px] gap-1">
                <span className="text-xl font-bold text-gray-900">{schedule.time.slice(0, 5)}</span>
                <span className="text-lg font-bold text-red-600">{schedule.channel_name}</span>
                {schedule.studio_label && (
                    <span className="inline-block bg-yellow-300 px-2 py-0.5 text-sm font-bold text-black rounded w-fit">
                        {schedule.studio_label}
                    </span>
                )}
            </div>

            {/* Program Info */}
            <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 truncate">{schedule.program_title}</h3>
                {schedule.match_info && (
                    <p className="text-base font-medium text-gray-700">{schedule.match_info}</p>
                )}
                {schedule.memo && (
                    <p className="text-sm font-bold text-red-500 mt-1">{schedule.memo}</p>
                )}
            </div>

            {/* Technical Info */}
            <div className="flex flex-col gap-1 text-sm min-w-[200px] md:text-right">
                {schedule.transmission_path && (
                    <div className="font-medium text-blue-700">{schedule.transmission_path}</div>
                )}
                {schedule.video_source_info && (
                    <div className="font-medium text-green-700">{schedule.video_source_info}</div>
                )}
                {schedule.audio_source_info && (
                    <div className="text-gray-600">{schedule.audio_source_info}</div>
                )}
                {schedule.contact_info && (
                    <div className="text-blue-600 font-medium mt-1">{schedule.contact_info}</div>
                )}
            </div>
        </div>
    )
}
