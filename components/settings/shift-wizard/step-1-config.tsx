"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns"
import { ko } from "date-fns/locale"
import { DailyShiftPattern, ShiftInfo, shiftService, ShiftPatternConfig } from "@/lib/shift-rotation"
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
    const [previewDate, setPreviewDate] = useState<Date>(new Date())
    const [previewTeam, setPreviewTeam] = useState<string>("1조")
    const [previewData, setPreviewData] = useState<ShiftInfo[]>([])


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
        if (data.pattern.length !== data.cycleLength) {
            const newPattern = Array.from({ length: data.cycleLength }, (_, i) => ({
                day: i,
                A: { team: `${(i % 5) + 1}조`, is_swap: false },
                N: { team: `${((i + 1) % 5) + 1}조`, is_swap: false }
            }))
            onChange({ ...data, pattern: newPattern })
        }
    }, [data.cycleLength])

    // Update preview & Check completion
    useEffect(() => {
        if (!data.validFrom) {
            setIsComplete(false)
            return
        }

        const start = startOfMonth(previewDate)
        const end = endOfMonth(previewDate)

        const tempConfig: ShiftPatternConfig = {
            id: 'preview',
            valid_from: format(data.validFrom, 'yyyy-MM-dd'),
            valid_to: null,
            cycle_length: data.cycleLength,
            pattern_json: data.pattern,
            roles_json: ["감독", "부감독", "영상"]
        }

        const shifts = shiftService.calculateShiftRange(start, end, previewTeam, tempConfig)
        setPreviewData(shifts)

        // Simple completion check: validFrom exists and pattern has length
        setIsComplete(!!data.validFrom && data.pattern.length > 0)

    }, [data, previewDate, previewTeam])

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

            {/* Main Content Split View */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden">

                {/* Left: Pattern Table */}
                <Card className="flex flex-col overflow-hidden transition-all duration-500">
                    <CardHeader className="py-3 bg-slate-50 border-b flex flex-row justify-between items-center">
                        <CardTitle className="text-sm">패턴 정의</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-4 overflow-y-auto bg-slate-50/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {data.pattern.map((dayPattern, i) => (
                                <div key={i} className="bg-white rounded-lg border shadow-sm p-4 flex flex-col gap-3 transition-all hover:shadow-md">
                                    <div className="flex items-center gap-2 border-b pb-2">
                                        <span className="font-bold text-lg text-slate-900">
                                            {i + 1}일차
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Day Shift (A) */}
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-xs font-semibold text-slate-500">주간 (A)</span>
                                            <div className="flex gap-2">
                                                <Select
                                                    value={dayPattern.A.team}
                                                    onValueChange={v => handlePatternChange(i, 'A', 'team', v)}
                                                >
                                                    <SelectTrigger className="h-9 flex-1">
                                                        <SelectValue placeholder="팀 선택" />
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
                                                        <SelectValue placeholder="팀 선택" />
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

                {/* Right: Preview */}
                <Card className="flex flex-col overflow-hidden transition-all duration-500">
                    <CardHeader className="py-3 bg-slate-50 border-b flex flex-row justify-between items-center">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-sm">미리보기</CardTitle>
                            <Select value={previewTeam} onValueChange={(v) => { setPreviewTeam(v); updateInteraction(); }}>
                                <SelectTrigger className="h-7 w-[80px] text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {["1조", "2조", "3조", "4조", "5조"].map(t => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-4">
                        <div className="flex justify-center mb-4">
                            <Calendar
                                mode="single"
                                selected={previewDate}
                                onSelect={(d) => { if (d) { setPreviewDate(d); updateInteraction(); } }}
                                className="rounded-md border shadow-sm"
                                locale={ko}
                            />
                        </div>

                        <div className="space-y-2">
                            <h3 className="font-bold text-sm border-b pb-2">
                                {format(previewDate, 'yyyy년 MM월', { locale: ko })} 근무표 ({previewTeam})
                            </h3>
                            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 mb-2">
                                <div>일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div>토</div>
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {Array.from({ length: startOfMonth(previewDate).getDay() }).map((_, i) => (
                                    <div key={`empty-${i}`} className="h-12 bg-gray-50 rounded"></div>
                                ))}
                                {previewData.map((day, i) => (
                                    <div
                                        key={i}
                                        className={cn(
                                            "h-14 p-1 rounded border flex flex-col items-center justify-between text-xs transition-colors",
                                            day.shiftType === 'A' ? "bg-yellow-50 border-yellow-200 text-yellow-900" :
                                                day.shiftType === 'N' ? "bg-slate-800 text-white border-slate-700" :
                                                    "bg-white border-gray-100 text-gray-400"
                                        )}
                                    >
                                        <span className="font-bold">{format(parseISO(day.date), 'd')}</span>
                                        <div className="flex flex-col items-center">
                                            <span className="font-bold text-lg leading-none">{day.shiftType}</span>
                                            {day.isSwap && (
                                                <span className="text-[10px] font-bold text-red-500 bg-white/90 px-1 rounded mt-0.5">
                                                    SWAP
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

        </div>
    )
}
