"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { FolderTabsList, FolderTabsTrigger } from "@/components/ui/folder-tabs"
import { Plus, LayoutList, X, Radio } from "lucide-react"
import { cn } from "@/lib/utils"
import { useBroadcastStore } from "@/store/broadcast"
import { useBroadcastTabStore } from "@/store/broadcast-tab-store"
import { BroadcastListView } from "@/components/broadcast/broadcast-list"
import { BroadcastDetail } from "@/components/broadcast/broadcast-detail"
import { BroadcastForm } from "@/components/broadcast/broadcast-form"

function BroadcastPageContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const mode = searchParams.get('mode')
    const dateParam = searchParams.get('date')

    const fetchSchedules = useBroadcastStore((state) => state.fetchSchedules)
    const { tabs, activeTab, addTab, removeTab, setActiveTab } = useBroadcastTabStore()

    const [createDialogOpen, setCreateDialogOpen] = useState(false)

    // Fetch schedules on mount
    useEffect(() => {
        fetchSchedules()
    }, [fetchSchedules])

    // Handle mode=today
    useEffect(() => {
        if (mode === 'today') {
            const today = format(new Date(), 'yyyy-MM-dd')
            addTab({
                id: today,
                title: format(new Date(), 'MM/dd (EEE)', { locale: ko }),
                date: today
            })
        }
    }, [mode, addTab])

    // Handle date param
    useEffect(() => {
        if (dateParam) {
            addTab({
                id: dateParam,
                title: format(new Date(dateParam), 'MM/dd (EEE)', { locale: ko }),
                date: dateParam
            })
        }
    }, [dateParam, addTab])

    const handleTabChange = (value: string) => {
        setActiveTab(value)
        if (value === 'list') {
            router.push('/broadcasts')
        } else {
            router.push(`/broadcasts?date=${value}`)
        }
    }

    const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
        e.preventDefault()
        e.stopPropagation()
        removeTab(tabId)
        router.push('/broadcasts')
    }

    const handleFormClose = () => {
        setCreateDialogOpen(false)
        fetchSchedules()
    }

    return (
        <MainLayout>
            <div className="px-8 pt-2 pb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">중계현황</h1>
                        <p className="text-muted-foreground">중계 및 수신 일정 관리</p>
                    </div>
                    <Button onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />새 중계 추가
                    </Button>
                </div>

                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <div className="print:hidden relative z-10 w-full overflow-x-auto">
                        <FolderTabsList>
                            <FolderTabsTrigger
                                value="list"
                                className={cn(
                                    activeTab !== 'list' && "text-blue-600 font-semibold"
                                )}
                            >
                                <div className="flex items-center gap-2 relative z-10">
                                    <LayoutList className={cn(
                                        "h-4 w-4",
                                        activeTab !== 'list' ? "animate-lighthouse-shake text-blue-500" : "text-foreground"
                                    )} />
                                    <span className={cn(activeTab !== 'list' && "text-blue-600 font-semibold")}>중계현황 목록</span>
                                </div>
                            </FolderTabsTrigger>
                            {tabs.map((tab) => (
                                <FolderTabsTrigger key={tab.id} value={tab.id}>
                                    <div className="flex items-center gap-2">
                                        <Radio className="h-4 w-4" />
                                        <span>{tab.title}</span>
                                        <div
                                            role="button"
                                            onMouseDown={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                handleCloseTab(e, tab.id)
                                            }}
                                            className="rounded-full p-0.5 hover:bg-slate-300/50 text-slate-500 hover:text-slate-700 transition-colors z-50"
                                        >
                                            <X className="h-3 w-3" />
                                        </div>
                                    </div>
                                </FolderTabsTrigger>
                            ))}
                        </FolderTabsList>
                    </div>

                    <TabsContent value="list" className="-mt-[2px] relative z-0">
                        <BroadcastListView />
                    </TabsContent>

                    {tabs.map((tab) => (
                        <TabsContent key={tab.id} value={tab.id} className="mt-6">
                            <BroadcastDetail date={tab.date} />
                        </TabsContent>
                    ))}
                </Tabs>

                {/* Create Dialog */}
                <BroadcastForm
                    open={createDialogOpen}
                    onClose={handleFormClose}
                />
            </div>
        </MainLayout>
    )
}

export default function BroadcastsPage() {
    return (
        <Suspense fallback={<div className="p-8">Loading...</div>}>
            <BroadcastPageContent />
        </Suspense>
    )
}
