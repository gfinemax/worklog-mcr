"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { format, addDays } from "date-fns"
import { ko } from "date-fns/locale"
import { ArrowRight, Check, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { auditLogger } from "@/lib/audit-logger"

interface ShiftChangeWizardProps {
    onSuccess: () => void
}

export function ShiftChangeWizard({ onSuccess }: ShiftChangeWizardProps) {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)

    // Step 1: Date
    const [validFrom, setValidFrom] = useState<Date | undefined>(undefined)

    // Step 2: Structure
    const [teamCount, setTeamCount] = useState("3")
    const [cycleLength, setCycleLength] = useState("6")

    // Step 3: Reassignment (Simplified for now)
    const [reassignmentConfirmed, setReassignmentConfirmed] = useState(false)

    const handleNext = () => {
        if (step === 1 && !validFrom) {
            toast.error("변경 시작일을 선택해주세요.")
            return
        }
        setStep(step + 1)
    }

    const handleBack = () => {
        setStep(step - 1)
    }

    const handleComplete = async () => {
        if (!validFrom) return
        setLoading(true)

        try {
            const validFromStr = format(validFrom, 'yyyy-MM-dd')
            const cycleLen = parseInt(cycleLength)
            const teams = parseInt(teamCount)

            // Generate default pattern for the new structure
            // Example: 3 teams, 6 days cycle -> 1, 2, 3 rotating
            const newPattern = Array.from({ length: cycleLen }, (_, i) => ({
                day: i,
                A: { team: `${(i % teams) + 1}조`, is_swap: false },
                N: { team: `${((i + 1) % teams) + 1}조`, is_swap: false } // Simple rotation logic
            }))

            // 1. Insert new config
            const { data: configData, error: configError } = await supabase
                .from('shift_pattern_configs')
                .insert({
                    valid_from: validFromStr,
                    cycle_length: cycleLen,
                    pattern_json: newPattern,
                    roles_json: ["감독", "부감독", "영상"]
                })
                .select()
                .single()

            if (configError) throw configError

            // 2. Log Audit
            await auditLogger.log({
                action: 'UPDATE_SHIFT_PATTERN',
                target_type: 'SHIFT_CONFIG',
                target_id: configData.id,
                changes: {
                    valid_from: validFromStr,
                    cycle_length: cycleLen,
                    teams: teams,
                    note: "Shift Change Wizard"
                }
            })

            toast.success("새로운 근무 패턴이 적용되었습니다.")
            setOpen(false)
            setStep(1)
            onSuccess()

        } catch (error: any) {
            console.error(error)
            toast.error("변경 실패: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100">
                    ✨ 근무 형태 변경 마법사
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>근무 형태 변경 마법사 (단계 {step}/4)</DialogTitle>
                    <DialogDescription>
                        안전하게 근무 패턴을 변경합니다. 단계별 안내를 따라주세요.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6">
                    {/* Step 1: When */}
                    {step === 1 && (
                        <div className="space-y-4 flex flex-col items-center">
                            <div className="bg-blue-100 p-4 rounded-full mb-2">
                                <span className="text-2xl font-bold text-blue-600">①</span>
                            </div>
                            <h3 className="text-lg font-semibold">언제부터 변경되나요?</h3>
                            <p className="text-sm text-muted-foreground text-center mb-4">
                                새로운 근무 패턴이 시작되는 <strong>첫 날짜</strong>를 선택해주세요.<br />
                                이 날짜 이전의 기록은 보존됩니다.
                            </p>
                            <Calendar
                                mode="single"
                                selected={validFrom}
                                onSelect={setValidFrom}
                                className="rounded-md border"
                                locale={ko}
                                disabled={(date) => date < new Date()} // Disable past dates
                            />
                        </div>
                    )}

                    {/* Step 2: Structure */}
                    {step === 2 && (
                        <div className="space-y-6 flex flex-col items-center">
                            <div className="bg-blue-100 p-4 rounded-full mb-2">
                                <span className="text-2xl font-bold text-blue-600">②</span>
                            </div>
                            <h3 className="text-lg font-semibold">어떻게 변경되나요?</h3>
                            <div className="grid grid-cols-2 gap-8 w-full max-w-md">
                                <div className="space-y-2">
                                    <Label>근무 조 개수</Label>
                                    <Select value={teamCount} onValueChange={setTeamCount}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="3">3개 조 (3교대)</SelectItem>
                                            <SelectItem value="4">4개 조 (4교대)</SelectItem>
                                            <SelectItem value="5">5개 조 (5교대)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>순환 주기 (일)</Label>
                                    <Input
                                        type="number"
                                        value={cycleLength}
                                        onChange={(e) => setCycleLength(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg w-full max-w-md text-sm text-slate-600">
                                <p>💡 <strong>{teamCount}개 조</strong>가 <strong>{cycleLength}일</strong> 주기로 순환합니다.</p>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Reassignment */}
                    {step === 3 && (
                        <div className="space-y-4 flex flex-col items-center">
                            <div className="bg-blue-100 p-4 rounded-full mb-2">
                                <span className="text-2xl font-bold text-blue-600">③</span>
                            </div>
                            <h3 className="text-lg font-semibold">팀원 재배치</h3>
                            <p className="text-sm text-muted-foreground text-center">
                                조 개수가 변경되면 기존 인원의 소속을 변경해야 합니다.<br />
                                <strong>[근무자 관리]</strong> 탭에서 별도로 진행하시겠습니까?
                            </p>

                            <div className="flex items-center gap-2 bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-yellow-800 text-sm mt-4">
                                <AlertTriangle className="h-5 w-5" />
                                <span>이 마법사 종료 후, 반드시 근무자 소속을 확인해주세요.</span>
                            </div>

                            <div className="flex items-center space-x-2 mt-4">
                                <Button
                                    variant={reassignmentConfirmed ? "default" : "outline"}
                                    onClick={() => setReassignmentConfirmed(true)}
                                    className="w-full"
                                >
                                    <Check className="mr-2 h-4 w-4" />
                                    네, 나중에 확인하겠습니다.
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Confirm */}
                    {step === 4 && (
                        <div className="space-y-6 flex flex-col items-center">
                            <div className="bg-blue-100 p-4 rounded-full mb-2">
                                <span className="text-2xl font-bold text-blue-600">④</span>
                            </div>
                            <h3 className="text-lg font-semibold">변경 내용 확인</h3>

                            <div className="w-full max-w-md space-y-4 border rounded-lg p-6">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">적용 시작일</span>
                                    <span className="font-bold">{validFrom ? format(validFrom, 'yyyy-MM-dd') : '-'}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">근무 형태</span>
                                    <span className="font-bold">{teamCount}조 {cycleLength}일 주기</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">상태</span>
                                    <span className="text-blue-600 font-bold">변경 대기</span>
                                </div>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                '확정' 버튼을 누르면 새로운 근무 패턴이 생성됩니다.
                            </p>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {step > 1 && (
                        <Button variant="outline" onClick={handleBack} disabled={loading}>
                            이전
                        </Button>
                    )}
                    {step < 4 ? (
                        <Button onClick={handleNext} disabled={step === 3 && !reassignmentConfirmed}>
                            다음 <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    ) : (
                        <Button onClick={handleComplete} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                            {loading ? "처리 중..." : "변경 확정"}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
