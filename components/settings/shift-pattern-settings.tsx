"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { shiftService, ShiftPatternConfig, ShiftInfo, DailyShiftPattern } from "@/lib/shift-rotation"
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns"
import { ko } from "date-fns/locale"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { Loader2, Save } from "lucide-react"
import { ShiftChangeWizard } from "@/components/settings/shift-change-wizard"

// UI Helper Interface (Internal State)
interface UIConfig {
    id: string
    valid_from: string
    cycle_length: number
    pattern_json: DailyShiftPattern[]
}

export function ShiftPatternSettings() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [config, setConfig] = useState<UIConfig | null>(null)

    // Preview State
    const [previewDate, setPreviewDate] = useState<Date>(new Date())
    const [previewTeam, setPreviewTeam] = useState<string>("1조")
    const [previewData, setPreviewData] = useState<ShiftInfo[]>([])

    useEffect(() => {
        fetchConfig()
    }, [])

    useEffect(() => {
        if (config) {
            updatePreview()
        }
    }, [config, previewDate, previewTeam])

    const fetchConfig = async () => {
        setLoading(true)
        try {
            const data = await shiftService.getConfig()
            if (data) {
                setConfig({
                    id: data.id,
                    valid_from: data.valid_from,
                    cycle_length: data.cycle_length,
                    pattern_json: data.pattern_json
                })
            } else {
                // Fallback default
                setConfig({
                    id: '',
                    valid_from: format(new Date(), 'yyyy-MM-dd'),
                    cycle_length: 10,
                    pattern_json: Array.from({ length: 10 }, (_, i) => ({
                        day: i,
                        A: { team: `${(i % 5) + 1}조`, is_swap: false },
                        N: { team: `${((i + 3) % 5) + 1}조`, is_swap: false }
                    }))
                })
            }
        } catch (error) {
            console.error(error)
            toast.error("설정을 불러오는데 실패했습니다.")
        } finally {
            setLoading(false)
        }
    }

    const updatePreview = () => {
        if (!config) return
        const start = startOfMonth(previewDate)
        const end = endOfMonth(previewDate)

        // Create a temporary ShiftPatternConfig object for calculation
        const tempConfig: ShiftPatternConfig = {
            id: config.id,
            valid_from: config.valid_from,
            valid_to: null,
            cycle_length: config.cycle_length,
            pattern_json: config.pattern_json,
            roles_json: ["감독", "부감독", "영상"]
        }

        const shifts = shiftService.calculateShiftRange(start, end, previewTeam, tempConfig)
        setPreviewData(shifts)
    }

    const handleSave = async () => {
        if (!config) return
        setSaving(true)

        // Insert new configuration version and return it
        const { data, error } = await supabase
            .from('shift_pattern_configs')
            .insert({
                valid_from: config.valid_from,
                cycle_length: config.cycle_length,
                pattern_json: config.pattern_json,
                roles_json: ["감독", "부감독", "영상"]
            })
            .select()
            .single()

        if (error) {
            toast.error("설정 저장 실패: " + error.message)
        } else if (data) {
            toast.success("근무 패턴 설정이 저장되었습니다.")
            // Update state directly with the saved data
            setConfig({
                id: data.id,
                valid_from: data.valid_from,
                cycle_length: data.cycle_length,
                pattern_json: data.pattern_json
            })
            // No need to call fetchConfig() which might return stale data due to race condition
        }
        setSaving(false)
    }

    const handlePatternChange = (dayIndex: number, type: 'A' | 'N', field: 'team' | 'is_swap', value: any) => {
        if (!config) return
        const newPattern = [...config.pattern_json]

        // Ensure the day object exists
        if (!newPattern[dayIndex]) {
            newPattern[dayIndex] = {
                day: dayIndex,
                A: { team: "1조", is_swap: false },
                N: { team: "1조", is_swap: false }
            }
        }

        if (field === 'is_swap') {
            newPattern[dayIndex][type].is_swap = value === 'true'
        } else {
            newPattern[dayIndex][type].team = value
        }

        setConfig({ ...config, pattern_json: newPattern })
    }

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
    }

    return (
        <div className="space-y-6 pb-20">




            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-semibold tracking-tight">근무 패턴 설정</h2>
                    <p className="text-sm text-muted-foreground">순환 근무 규칙과 역할 교대 패턴을 관리합니다.</p>
                </div>
                <div className="flex gap-2">
                    <ShiftChangeWizard onSuccess={fetchConfig} />
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        설정 저장
                    </Button>
                </div>
            </div>

            {config && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Left Column: Settings */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">기본 설정</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label>순환 주기 (일)</Label>
                                        <Input
                                            type="number"
                                            value={config.cycle_length}
                                            onChange={e => setConfig({ ...config, cycle_length: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>기준일 (Anchor Date)</Label>
                                        <Input
                                            type="date"
                                            value={config.valid_from}
                                            onChange={e => setConfig({ ...config, valid_from: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">순환 패턴 정의</CardTitle>
                                <CardDescription>
                                    각 일차별 주간(A)/야간(N) 근무 조와 역할 스왑 여부를 설정합니다.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                                    {Array.from({ length: config.cycle_length }).map((_, i) => {
                                        const dayPattern = config.pattern_json.find(p => p.day === i) || { A: { team: '', is_swap: false }, N: { team: '', is_swap: false } }
                                        return (
                                            <div key={i} className="flex items-center gap-4 p-3 border rounded-lg bg-slate-50">
                                                <div className="w-12 font-bold text-center border-r border-slate-200 pr-4">
                                                    D+{i}
                                                </div>
                                                <div className="flex-1 grid grid-cols-2 gap-4">
                                                    {/* Day Shift */}
                                                    <div className="space-y-2">
                                                        <Label className="text-xs text-gray-500 font-bold">주간 (A)</Label>
                                                        <div className="flex gap-2">
                                                            <Select
                                                                value={dayPattern.A.team}
                                                                onValueChange={v => handlePatternChange(i, 'A', 'team', v)}
                                                            >
                                                                <SelectTrigger className="h-8 text-xs">
                                                                    <SelectValue placeholder="조 선택" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {["1조", "2조", "3조", "4조", "5조"].map(t => (
                                                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <Select
                                                                value={String(dayPattern.A.is_swap)}
                                                                onValueChange={v => handlePatternChange(i, 'A', 'is_swap', v)}
                                                            >
                                                                <SelectTrigger className={`h-8 text-xs w-[80px] ${dayPattern.A.is_swap ? 'text-red-600 font-bold' : ''}`}>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="false">정상</SelectItem>
                                                                    <SelectItem value="true">스왑</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>

                                                    {/* Night Shift */}
                                                    <div className="space-y-2">
                                                        <Label className="text-xs text-gray-500 font-bold">야간 (N)</Label>
                                                        <div className="flex gap-2">
                                                            <Select
                                                                value={dayPattern.N.team}
                                                                onValueChange={v => handlePatternChange(i, 'N', 'team', v)}
                                                            >
                                                                <SelectTrigger className="h-8 text-xs">
                                                                    <SelectValue placeholder="조 선택" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {["1조", "2조", "3조", "4조", "5조"].map(t => (
                                                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                            <Select
                                                                value={String(dayPattern.N.is_swap)}
                                                                onValueChange={v => handlePatternChange(i, 'N', 'is_swap', v)}
                                                            >
                                                                <SelectTrigger className={`h-8 text-xs w-[80px] ${dayPattern.N.is_swap ? 'text-red-600 font-bold' : ''}`}>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="false">정상</SelectItem>
                                                                    <SelectItem value="true">스왑</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Preview */}
                    <div className="space-y-6">
                        <Card className="h-full">
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <CardTitle className="text-base">미리보기</CardTitle>
                                    <Select value={previewTeam} onValueChange={setPreviewTeam}>
                                        <SelectTrigger className="w-[100px]">
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
                            <CardContent>
                                <Calendar
                                    mode="single"
                                    selected={previewDate}
                                    onSelect={(d) => d && setPreviewDate(d)}
                                    className="rounded-md border mb-4"
                                    locale={ko}
                                />

                                <div className="space-y-2 mt-4">
                                    <h3 className="font-bold text-lg border-b pb-2">
                                        {format(previewDate, 'yyyy년 MM월', { locale: ko })} 근무표
                                    </h3>
                                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 mb-2">
                                        <div>일</div><div>월</div><div>화</div><div>수</div><div>목</div><div>금</div><div>토</div>
                                    </div>
                                    <div className="grid grid-cols-7 gap-1">
                                        {/* Fill empty days */}
                                        {Array.from({ length: startOfMonth(previewDate).getDay() }).map((_, i) => (
                                            <div key={`empty-${i}`} className="h-20 bg-gray-50 rounded"></div>
                                        ))}

                                        {previewData.map((day, i) => (
                                            <div
                                                key={i}
                                                className={`h-20 p-1 rounded border flex flex-col items-center justify-between text-xs ${day.shiftType === 'A' ? 'bg-yellow-50 border-yellow-200' :
                                                    day.shiftType === 'N' ? 'bg-slate-800 text-white border-slate-700' :
                                                        'bg-white border-gray-100'
                                                    }`}
                                            >
                                                <span className="font-bold">{format(parseISO(day.date), 'd')}</span>
                                                <span className="font-bold text-lg">{day.shiftType}</span>
                                                {day.shiftType !== 'Y' && day.shiftType !== 'S' && (
                                                    <div className="flex gap-1 text-[10px]">
                                                        {day.isSwap ? <span className="text-red-500 font-bold">SWAP</span> : <span>Normal</span>}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    )
}
