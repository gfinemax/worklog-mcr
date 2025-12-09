"use client"

import { Suspense, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { FolderTabsList, FolderTabsTrigger } from "@/components/ui/folder-tabs"
import { BroadcastListView } from "@/components/broadcast/broadcast-list"
import { BroadcastDetail } from "@/components/broadcast/broadcast-detail"
import { useBroadcastTabStore } from "@/store/broadcast-tab-store"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { X, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

function BroadcastPageContent() {
    const { tabs, activeTab, setActiveTab, removeTab, addTab } = useBroadcastTabStore()
    const searchParams = useSearchParams()
    const router = useRouter()

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
            <div className="p-6 pt-3 h-full flex-col">
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                    <FolderTabsList>
                        {/* Fixed "List" Tab */}
                        <FolderTabsTrigger value="list" className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            중계현황
                        </FolderTabsTrigger>

                        {/* Dynamic Tabs */}
                        {tabs.map((tab) => (
                            <FolderTabsTrigger
                                key={tab.id}
                                value={tab.id}
                                className="flex items-center gap-1 group/tab"
                            >
                                {tab.title}
                                <span
                                    role="button"
                                    tabIndex={0}
                                    className="h-4 w-4 ml-1 opacity-0 group-hover/tab:opacity-100 transition-opacity flex items-center justify-center rounded hover:bg-slate-200"
                                    onClick={(e) => handleRemoveTab(e, tab.id)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleRemoveTab(e as any, tab.id)}
                                >
                                    <X className="h-3 w-3" />
                                </span>
                            </FolderTabsTrigger>
                        ))}
                    </FolderTabsList>

                    {/* List Content */}
                    <TabsContent value="list" className="mt-0">
                        <BroadcastListView onNewClick={() => { }} />
                    </TabsContent>

                    {/* Detail Contents */}
                    {tabs.map((tab) => (
                        <TabsContent key={tab.id} value={tab.id} className="mt-0">
                            <BroadcastDetail date={tab.date} />
                        </TabsContent>
                    ))}
                </Tabs>
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
