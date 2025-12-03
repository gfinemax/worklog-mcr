"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { DailyShiftPattern } from "@/lib/shift-rotation"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Step1ConfigProps {
    data: {
        validFrom: Date | undefined
        cycleLength: number
        pattern: DailyShiftPattern[]
    }
    onChange: (data: any) => void
    onNext: () => void
}

export function Step1Config({ data, onChange, onNext }: Step1ConfigProps) {
    // Completion State
    const [isComplete, setIsComplete] = useState(false)

    // Idle Detection State
    const [lastInteractionTime, setLastInteractionTime] = useState<number>(Date.now())
    const [isIdle, setIsIdle] = useState(false)

    // Idle Timer Loop
    useEffect(() => {
        const checkIdle = setInterval(() => {
            if (Date.now() - lastInteractionTime > 3000) {
                setIsIdle(true)
            } else {
                setIsIdle(false)
            }
        }, 1000)
        return () => clearInterval(checkIdle)
    }, [lastInteractionTime])

    const updateInteraction = () => {
        setLastInteractionTime(Date.now())
        setIsIdle(false)
    }

    // Initialize pattern if empty
    useEffect(() => {
        // Only initialize if pattern is empty (length 0) OR length doesn't match cycle length
        // AND we are not in edit mode (checking if data.pattern has content)
        if (data.pattern.length === 0 || data.pattern.length !== data.cycleLength) {
            // If we have data.pattern but length mismatch, we might want to preserve it or reset.
            // For now, if length mismatch, we reset.

            // But wait, if we are loading an existing config, data.pattern should be populated.
            // If data.pattern is populated but length matches, we do nothing.

            if (data.pattern.length > 0 && data.pattern.length === data.cycleLength) return

            const newPattern = Array.from({ length: data.cycleLength }, (_, i) => ({
                day: i,
                A: { team: `${(i % 5) + 1}조`, is_swap: false },
                N: { team: `${((i + 1) % 5) + 1}조`, is_swap: false }
            }))
            onChange({ ...data, pattern: newPattern })
        }
    }, [data.cycleLength])

    // Check completion
    useEffect(() => {
        // Simple completion check: validFrom exists and pattern has length
        setIsComplete(!!data.validFrom && data.pattern.length > 0)
    }, [data])

    const handlePatternChange = (dayIndex: number, type: 'A' | 'N', field: 'team' | 'is_swap', value: any) => {
        const newPattern = [...data.pattern]
        if (!newPattern[dayIndex]) return

        if (field === 'is_swap') {
            newPattern[dayIndex][type].is_swap = value === 'true'
        } else {
            newPattern[dayIndex][type].team = value
        }
        onChange({ ...data, pattern: newPattern })
        updateInteraction()
    }


    return (
        <div className="h-full flex flex-col gap-4 relative">
            {/* Header & Navigation */}
            <div className="flex justify-between items-center bg-white p-2 rounded-lg border shadow-sm z-10">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold px-2">근무 패턴 설정</h2>
                </div>

                <div className="relative">
                    <Button
                        onClick={onNext}
                        disabled={!data.validFrom}
                        className={cn(
                            "bg-blue-600 hover:bg-blue-700 transition-all duration-500",
                            isComplete ? "ring-4 ring-blue-300 ring-offset-2 animate-pulse shadow-lg" : ""
                        )}
                    >
                        다음 단계 <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Global Settings Bar */}
            <div className="flex gap-6 items-center bg-white p-4 rounded-lg border shadow-sm transition-all duration-500">
                <div className="flex items-center gap-3">
                    <Label className="whitespace-nowrap">적용 시작일 (기준일)</Label>
                    <Input
                        type="date"
                        className="w-40"
                        value={data.validFrom ? format(data.validFrom, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                            if (e.target.value) {
                                const [year, month, day] = e.target.value.split('-').map(Number)
                                // Set time to 12:00 to avoid timezone shifts
                                const localDate = new Date(year, month - 1, day, 12, 0, 0)
                                onChange({ ...data, validFrom: localDate })
                            } else {
                                onChange({ ...data, validFrom: undefined })
                            }
                            updateInteraction()
                        }}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <Label className="whitespace-nowrap">순환 주기 (일)</Label>
                    <Input
                        type="number"
                        className="w-24"
                        value={data.cycleLength}
                        onChange={(e) => {
                            onChange({ ...data, cycleLength: parseInt(e.target.value) })
                            updateInteraction()
                        }}
                    />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                {/* Pattern Table */}
                <Card className="flex flex-col h-full overflow-hidden transition-all duration-500">
                    <CardHeader className="py-3 bg-slate-50 border-b flex flex-row justify-between items-center">
                        <CardTitle className="text-sm">패턴 정의</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-4 overflow-y-auto bg-slate-50/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                            {data.pattern.map((dayPattern, i) => (
                                <div key={i} className="bg-white rounded-lg border shadow-sm p-4 flex flex-col gap-3 transition-all hover:shadow-md">
                                    <div className="flex items-center gap-2 border-b pb-2">
                                        <span className="font-bold text-lg text-slate-900">
                                            {i + 1}일차
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        {/* Day Shift (A) */}
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-xs font-semibold text-slate-500">주간 (A)</span>
                                            <div className="flex gap-2">
                                                <Select
                                                    value={dayPattern.A.team}
                                                    onValueChange={v => handlePatternChange(i, 'A', 'team', v)}
                                                >
                                                    <SelectTrigger className="h-9 flex-1">
                                                        <SelectValue placeholder="조 선택" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {["1조", "2조", "3조", "4조", "5조"].map(t => (
                                                            <SelectItem key={t} value={t}>{t}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                <Select
                                                    value={dayPattern.A.is_swap ? "true" : "false"}
                                                    onValueChange={v => handlePatternChange(i, 'A', 'is_swap', v)}
                                                >
                                                    <SelectTrigger className={cn(
                                                        "h-9 w-20",
                                                        dayPattern.A.is_swap ? "text-red-600 font-bold bg-red-50 border-red-200" : "text-slate-600"
                                                    )}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="false">정상</SelectItem>
                                                        <SelectItem value="true" className="text-red-600 font-bold">스왑</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>

                                        {/* Night Shift (N) */}
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-xs font-semibold text-slate-500">야간 (N)</span>
                                            <div className="flex gap-2">
                                                <Select
                                                    value={dayPattern.N.team}
                                                    onValueChange={v => handlePatternChange(i, 'N', 'team', v)}
                                                >
                                                    <SelectTrigger className="h-9 flex-1">
                                                        <SelectValue placeholder="조 선택" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {["1조", "2조", "3조", "4조", "5조"].map(t => (
                                                            <SelectItem key={t} value={t}>{t}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                <Select
                                                    value={dayPattern.N.is_swap ? "true" : "false"}
                                                    onValueChange={v => handlePatternChange(i, 'N', 'is_swap', v)}
                                                >
                                                    <SelectTrigger className={cn(
                                                        "h-9 w-20",
                                                        dayPattern.N.is_swap ? "text-red-600 font-bold bg-red-50 border-red-200" : "text-slate-600"
                                                    )}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="false">정상</SelectItem>
                                                        <SelectItem value="true" className="text-red-600 font-bold">스왑</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

        </div>
    )
}
