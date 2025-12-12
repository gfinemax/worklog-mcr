"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { WorkerManagement } from "@/components/settings/worker-management"
import { WizardDashboard } from "@/components/settings/shift-wizard/wizard-dashboard"
import { ConfigHistoryList } from "@/components/settings/shift-wizard/config-history-list"
import { useSearchParams, useRouter } from "next/navigation"
import { FolderTabsList, FolderTabsTrigger } from "@/components/ui/folder-tabs"
import { useShiftWizardStore } from "@/store/shift-wizard-store"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

import { Suspense } from "react"

function WorkerPatternSettingsContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const currentTab = searchParams.get('tab') || 'history'

    const { currentStep, isWizardActive, setStep } = useShiftWizardStore()

    // Sync Tab with Step when Wizard is Active
    useEffect(() => {
        if (isWizardActive) {
            if (currentStep === 1) router.push(`/settings/worker-pattern?tab=pattern`)
            if (currentStep === 2) router.push(`/settings/worker-pattern?tab=workers`)
            if (currentStep === 3) router.push(`/settings/worker-pattern?tab=history`)
        }
    }, [currentStep, isWizardActive, router])

    // Sync Step with Tab (Optional: if user clicks tab manually)
    const handleTabChange = (value: string) => {
        if (isWizardActive) {
            if (value === 'pattern') setStep(1)
            if (value === 'workers') setStep(2)
            if (value === 'history') setStep(3)
        }
        router.push(`/settings/worker-pattern?tab=${value}`)
    }

    const getTabZIndex = (tabValue: string) => {
        if (tabValue === 'pattern') return "data-[state=inactive]:z-[3]"
        if (tabValue === 'workers') return "data-[state=inactive]:z-[2]"
        return "data-[state=inactive]:z-[1]"
    }

    const getProgressWidth = () => {
        if (currentTab === 'pattern') return '33.3%'
        if (currentTab === 'workers') return '66.6%'
        return '100%'
    }

    return (
        <MainLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">근무패턴 설정</h1>
                        <p className="text-muted-foreground">근무자 관리 및 순환 근무 패턴을 통합 설정, 관리합니다.</p>
                    </div>
                    {isWizardActive && (
                        <Button
                            variant="outline"
                            onClick={() => {
                                if (confirm("작성 중인 내용이 사라집니다. 마법사를 종료하시겠습니까?")) {
                                    useShiftWizardStore.getState().resetWizard()
                                }
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                            마법사 종료 (Exit)
                        </Button>
                    )}
                </div>

                <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-4">
                    <div className="relative">
                        <FolderTabsList>
                            <FolderTabsTrigger value="pattern" className={getTabZIndex('pattern')}>
                                {isWizardActive ? "Step 1. 근무형태 설정" : "운영 현황 (Dashboard)"}
                            </FolderTabsTrigger>
                            <FolderTabsTrigger value="workers" className={getTabZIndex('workers')}>
                                {isWizardActive ? "Step 2. 근무자 배정" : "근무자 관리 (Personnel)"}
                            </FolderTabsTrigger>
                            <FolderTabsTrigger value="history" className={getTabZIndex('history')}>
                                {isWizardActive ? "Step 3. 설정 확인" : "설정 이력 (History)"}
                            </FolderTabsTrigger>
                            {!isWizardActive && (
                                <Button
                                    size="sm"
                                    className="ml-auto bg-blue-600 hover:bg-blue-700 text-white gap-2 mb-1 mr-1"
                                    onClick={() => router.push('/settings/worker-pattern?tab=pattern')}
                                >
                                    <Plus className="h-4 w-4" />
                                    근무패턴 추가하기
                                </Button>
                            )}
                        </FolderTabsList>
                        {/* Progress Line - Only visible in Wizard Mode */}
                        {isWizardActive && (
                            <div className="absolute bottom-0 left-0 w-full h-[6px] bg-muted z-20 rounded-full overflow-hidden">
                                {/* Separators */}
                                <div className="absolute top-0 bottom-0 left-[33.3%] w-[2px] bg-background z-30" />
                                <div className="absolute top-0 bottom-0 left-[66.6%] w-[2px] bg-background z-30" />

                                {/* Fill */}
                                <div
                                    className="h-full bg-foreground transition-all duration-500 ease-in-out"
                                    style={{ width: getProgressWidth() }}
                                />
                            </div>
                        )}
                    </div>
                    <TabsContent value="history" className="space-y-4 mt-0">
                        <ConfigHistoryList />
                    </TabsContent>
                    <TabsContent value="workers" className="space-y-4 mt-0">
                        <WorkerManagement />
                    </TabsContent>
                    <TabsContent value="pattern" className="space-y-4 mt-0">
                        <WizardDashboard />
                    </TabsContent>
                </Tabs>
            </div>
        </MainLayout>
    )
}

export default function WorkerPatternSettingsPage() {
    return (
        <Suspense fallback={<MainLayout><div className="p-6">Loading...</div></MainLayout>}>
            <WorkerPatternSettingsContent />
        </Suspense>
    )
}
