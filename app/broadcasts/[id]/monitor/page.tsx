"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Loader2, ArrowLeft, Minimize2, Maximize2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MainLayout } from "@/components/layout/main-layout"
import { cn } from "@/lib/utils"

export default function BroadcastMonitorPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [loading, setLoading] = useState(true)
    const [schedule, setSchedule] = useState<any>(null)
    const [isFullScreen, setIsFullScreen] = useState(false)

    const fetchSchedule = async (id: string) => {
        setLoading(true)
        const { data, error } = await supabase
            .from('broadcast_schedules')
            .select('*')
            .eq('id', id)
            .single()

        if (error) {
            console.error('Error fetching schedule:', error)
        } else {
            setSchedule(data)
        }
        setLoading(false)
    }

    useEffect(() => {
        if (id) {
            fetchSchedule(id)
        }
    }, [id])

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                setIsFullScreen(true)
            }).catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`)
            })
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen()
                setIsFullScreen(false)
            }
        }
    }

    // Listen for fullscreen change events (e.g. user pressing Esc)
    useEffect(() => {
        const handleFullScreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement)
        }

        document.addEventListener('fullscreenchange', handleFullScreenChange)
        return () => document.removeEventListener('fullscreenchange', handleFullScreenChange)
    }, [])

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    if (!schedule) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-4">
                <p className="text-xl font-semibold">일정을 찾을 수 없습니다.</p>
                <Button onClick={() => router.back()}>돌아가기</Button>
            </div>
        )
    }

    const Content = () => (
        <div className={cn(
            "flex flex-col h-full bg-white p-8 overflow-hidden relative",
            isFullScreen ? "fixed inset-0 z-50" : "min-h-[calc(100vh-4rem)]"
        )}>
            {/* Header / Controls */}
            <div className="flex justify-between items-start mb-12">
                <div className="flex items-center gap-4">
                    {!isFullScreen && (
                        <Button variant="ghost" onClick={() => router.back()} className="mr-2">
                            <ArrowLeft className="h-6 w-6" />
                        </Button>
                    )}
                    <div className="flex flex-col">
                        <h1 className="text-5xl font-black text-red-600 tracking-tight">{schedule.channel_name}</h1>
                        <span className="text-3xl font-bold text-gray-800 mt-2">{schedule.time.slice(0, 5)}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {schedule.studio_label && (
                        <div className="bg-yellow-300 px-6 py-2 rounded-md shadow-sm">
                            <span className="text-3xl font-black text-black">{schedule.studio_label}</span>
                        </div>
                    )}
                    <Button variant="outline" size="icon" onClick={toggleFullScreen} className="ml-4">
                        {isFullScreen ? <Minimize2 className="h-6 w-6" /> : <Maximize2 className="h-6 w-6" />}
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col justify-center items-center text-center space-y-8">
                <h2 className="text-6xl font-black text-gray-900 leading-tight">
                    {schedule.program_title}
                </h2>
                {schedule.match_info && (
                    <div className="text-5xl font-bold text-gray-800 bg-gray-100 px-8 py-4 rounded-xl">
                        {schedule.match_info}
                    </div>
                )}
            </div>

            {/* Technical Details */}
            <div className="grid grid-cols-2 gap-12 mt-12 border-t-4 border-gray-200 pt-12">
                <div className="space-y-6">
                    <div className="flex flex-col gap-2">
                        <span className="text-2xl font-bold text-gray-500">Transmission Path</span>
                        <span className="text-4xl font-bold text-blue-700">{schedule.transmission_path || '-'}</span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="text-2xl font-bold text-gray-500">Video Source</span>
                        <span className="text-4xl font-bold text-green-700">{schedule.video_source_info || '-'}</span>
                    </div>
                </div>

                <div className="space-y-6 text-right">
                    <div className="flex flex-col gap-2 items-end">
                        <span className="text-2xl font-bold text-gray-500">Audio Source</span>
                        <span className="text-3xl font-bold text-gray-700">{schedule.audio_source_info || '-'}</span>
                    </div>
                    {schedule.biss_key && (
                        <div className="flex flex-col gap-2 items-end">
                            <span className="text-2xl font-bold text-gray-500">BISS Key</span>
                            <span className="text-3xl font-mono font-bold text-purple-700">{schedule.biss_key}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer / Memo */}
            {(schedule.memo || schedule.contact_info) && (
                <div className="mt-12 bg-red-50 p-6 rounded-xl border-l-8 border-red-500 flex justify-between items-center">
                    <span className="text-3xl font-bold text-red-600 animate-pulse">
                        {schedule.memo}
                    </span>
                    <span className="text-2xl font-bold text-blue-600">
                        {schedule.contact_info}
                    </span>
                </div>
            )}
        </div>
    )

    if (isFullScreen) {
        return <Content />
    }

    return (
        <MainLayout>
            <Content />
        </MainLayout>
    )
}
