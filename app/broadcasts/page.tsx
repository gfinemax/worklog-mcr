"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { FolderTabsList, FolderTabsTrigger } from "@/components/ui/folder-tabs"
import { DailyBroadcastList } from "@/components/broadcast/daily-broadcast-list"
import { BroadcastDetail } from "@/components/broadcast/broadcast-detail"
import { BroadcastWizard } from "@/components/broadcast/broadcast-wizard"
import { useBroadcastTabStore } from "@/store/broadcast-tab-store"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { X, LayoutList, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

function BroadcastPageContent() {
    const { tabs, activeTab, setActiveTab, removeTab, addTab } = useBroadcastTabStore()
    const searchParams = useSearchParams()
    const router = useRouter()
    const [wizardOpen, setWizardOpen] = useState(false)

    // Handle URL sync
    useEffect(() => {
        const date = searchParams.get('date')

        if (date) {
            // If URL has date param, open that tab
            const existingTab = tabs.find(t => t.id === date)
            if (!existingTab) {
                addTab({
                    id: date,
                    title: format(new Date(date + 'T00:00:00'), 'MM/dd (EEE)', { locale: ko }),
                    date: date
                })
            } else {
                setActiveTab(date)
            }
        }
    }, [searchParams, tabs, addTab, setActiveTab])

    const handleTabChange = (value: string) => {
        setActiveTab(value)
        if (value === 'list') {
            router.push('/broadcasts')
        } else {
            router.push(`/broadcasts?date=${value}`)
        }
    }

    const handleRemoveTab = (e: React.MouseEvent, tabId: string) => {
        e.stopPropagation()
        removeTab(tabId)
        if (activeTab === tabId) {
            router.push('/broadcasts')
        }
    }

    // "today" mode - open today's tab
    useEffect(() => {
        const mode = searchParams.get('mode')
        if (mode === 'today') {
            const today = format(new Date(), 'yyyy-MM-dd')
            addTab({
                id: today,
                title: format(new Date(), 'MM/dd (EEE)', { locale: ko }),
                date: today
            })
            router.replace(`/broadcasts?date=${today}`)
        }
    }, [searchParams, addTab, router])

    return (
        <MainLayout>
            <div className="px-8 pt-2 pb-8">
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    {/* Tabs Header with Add Button */}
                    <div className="print:hidden relative z-10 w-full flex items-center justify-between mb-0">
                        <div className="overflow-x-auto">
                            <FolderTabsList>
                                {/* Fixed "List" Tab - matches worklog style */}
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
                                        <span className={cn(activeTab !== 'list' && "text-blue-600 font-semibold")}>중계현황</span>
                                    </div>
                                </FolderTabsTrigger>

                                {/* Dynamic Tabs */}
                                {tabs.map((tab) => (
                                    <FolderTabsTrigger key={tab.id} value={tab.id}>
                                        <div className="flex items-center gap-2">
                                            <span>{tab.title}</span>
                                            <div
                                                role="button"
                                                onMouseDown={(e) => {
                                                    e.preventDefault()
                                                    e.stopPropagation()
                                                    handleRemoveTab(e, tab.id)
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

                        {/* Add Button */}
                        <Button onClick={() => setWizardOpen(true)} className="ml-4 shrink-0">
                            <Plus className="mr-2 h-4 w-4" />
                            일정 추가
                        </Button>
                    </div>

                    {/* List Content */}
                    <TabsContent value="list" className="-mt-[2px] relative z-0">
                        <DailyBroadcastList onNewClick={() => { }} />
                    </TabsContent>

                    {/* Detail Contents */}
                    {tabs.map((tab) => (
                        <TabsContent key={tab.id} value={tab.id} className="mt-6">
                            <BroadcastDetail date={tab.date} />
                        </TabsContent>
                    ))}
                </Tabs>

                {/* Wizard Dialog */}
                <BroadcastWizard
                    open={wizardOpen}
                    onClose={() => setWizardOpen(false)}
                    defaultDate={activeTab !== 'list' ? activeTab : undefined}
                />
            </div>
        </MainLayout>
    )
}

export default function BroadcastsPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center h-screen">로딩 중...</div>}>
            <BroadcastPageContent />
        </Suspense>
    )
}

