"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

import { Step1Config } from "./step-1-config"
import { Step2Roster } from "./step-2-roster"
import { Step3Confirm } from "./step-3-confirm"

interface ShiftWizardDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess: () => void
    initialConfig?: {
        id?: string
        validFrom: Date
        cycleLength: number
        pattern: any[]
        assignments: Record<string, string[]>
        memo: string
    } | null
}

export function ShiftWizardDialog({ open, onOpenChange, onSuccess, initialConfig }: ShiftWizardDialogProps) {
    const [step, setStep] = useState(1)
    const [wizardData, setWizardData] = useState<{
        id?: string
        validFrom: Date | undefined
        cycleLength: number
        pattern: any[]
        assignments: Record<string, string[]>
        memo: string
    }>({
        id: initialConfig?.id,
        validFrom: initialConfig?.validFrom,
        cycleLength: initialConfig?.cycleLength || 4,
        pattern: initialConfig?.pattern || [],
        assignments: initialConfig?.assignments || {},
        memo: initialConfig?.memo || ""
    })

    // Reset when opening with new config
    if (open && initialConfig && wizardData.id !== initialConfig.id) {
        setWizardData({
            id: initialConfig.id,
            validFrom: initialConfig.validFrom,
            cycleLength: initialConfig.cycleLength,
            pattern: initialConfig.pattern,
            assignments: initialConfig.assignments,
            memo: initialConfig.memo
        })
        setStep(1)
    } else if (open && !initialConfig && wizardData.id) {
        // Reset to empty if opening without config (create mode) but had data
        setWizardData({
            id: undefined,
            validFrom: undefined,
            cycleLength: 4,
            pattern: [],
            assignments: {},
            memo: ""
        })
        setStep(1)
    }

    // Folder Tab Style Navigation
    const steps = [
        { id: 1, label: "1. 설정 (Config)" },
        { id: 2, label: "2. 배정 (Roster)" },
        { id: 3, label: "3. 완료 (Confirm)" },
    ]

    const handleNext = () => setStep(prev => prev + 1)
    const handleBack = () => setStep(prev => prev - 1)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
                <div className="bg-slate-100 border-b px-6 pt-6 pb-0 flex gap-2 shrink-0">
                    {steps.map((s) => (
                        <div
                            key={s.id}
                            className={cn(
                                "px-6 py-3 text-sm font-bold rounded-t-lg transition-all cursor-default select-none",
                                step === s.id
                                    ? "bg-white text-blue-600 border-t border-x border-b-white translate-y-[1px] shadow-sm"
                                    : "bg-slate-200 text-slate-500 hover:bg-slate-300 border-transparent"
                            )}
                        >
                            {s.label}
                        </div>
                    ))}
                </div>

                <div className="flex-1 p-6 overflow-y-auto bg-white">
                    {step === 1 && (
                        <Step1Config
                            data={wizardData}
                            onChange={(d) => setWizardData({ ...wizardData, ...d })}
                            onNext={handleNext}
                        />
                    )}
                    {step === 2 && (
                        <Step2Roster
                            data={wizardData}
                            onChange={(d) => setWizardData({ ...wizardData, ...d })}
                            onNext={handleNext}
                            onBack={handleBack}
                        />
                    )}
                    {step === 3 && wizardData.validFrom && (
                        <Step3Confirm
                            data={wizardData as any}
                            onChange={(d) => setWizardData({ ...wizardData, ...d })}
                            onBack={handleBack}
                            onComplete={onSuccess}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
