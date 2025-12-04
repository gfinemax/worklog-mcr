"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react"
import { format } from "date-fns"
import { supabase } from "@/lib/supabase"
import { auditLogger } from "@/lib/audit-logger"
import { useAuthStore } from "@/store/auth"
import { cn } from "@/lib/utils"

interface Step3ConfirmProps {
    data: {
        id?: string
        validFrom: Date
        cycleLength: number
        pattern: any[]
        assignments: Record<string, string[]>
        memo: string
    }
    onChange: (data: any) => void
    onBack: () => void
    onComplete: () => void
}

export function Step3Confirm({ data, onChange, onBack, onComplete }: Step3ConfirmProps) {
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { user } = useAuthStore()

    const handleSave = async () => {
        if (!user) return
        setSaving(true)
        setError(null)

        try {
            // 1. Create or Update Shift Pattern Config
            let configData
            let configError

            const payload = {
                valid_from: format(data.validFrom, 'yyyy-MM-dd'),
                cycle_length: data.cycleLength,
                pattern_json: data.pattern,
                roles_json: ["감독", "부감독", "영상"],
                roster_json: data.assignments,
                memo: data.memo,
                created_by: user.id
            }

            if (data.id) {
                // Update existing
                const result = await supabase
                    .from('shift_pattern_configs')
                    .update(payload)
                    .eq('id', data.id)
                    .select()
                    .single()

                configData = result.data
                configError = result.error
            } else {
                // Insert new
                const result = await supabase
                    .from('shift_pattern_configs')
                    .insert(payload)
                    .select()
                    .single()

                configData = result.data
                configError = result.error
            }

            if (configError) throw configError

            // 2. Update Worker Groups (Group Members)
            // This is tricky because we need to map team names to group IDs.
            // Assuming groups exist with names "1조", "2조", etc.

            // First, get all group IDs
            const { data: groups } = await supabase.from('groups').select('id, name')
            if (!groups) throw new Error("Failed to fetch groups")

            const updates = []
            for (const [teamName, userIds] of Object.entries(data.assignments)) {
                if (teamName === 'Unassigned') {
                    // Handle Unassigned: Remove from any group
                    for (const userId of userIds) {
                        updates.push(
                            supabase
                                .from('group_members')
                                .delete()
                                .eq('user_id', userId)
                        )
                    }
                    continue
                }

                const group = groups.find(g => g.name === teamName)
                if (!group) continue // Should create group if missing? For now assume exists.

                // Use index as display_order
                for (let i = 0; i < userIds.length; i++) {
                    const userId = userIds[i]
                    const displayOrder = i + 1

                    // Update group_members
                    // We need to upsert or update. 
                    // Ideally, we should remove from old group and add to new, but simple update works if 1:1

                    // Check if exists
                    const { data: existing } = await supabase
                        .from('group_members')
                        .select('id')
                        .eq('user_id', userId)
                        .single()

                    if (existing) {
                        updates.push(
                            supabase
                                .from('group_members')
                                .update({
                                    group_id: group.id,
                                    display_order: displayOrder
                                })
                                .eq('user_id', userId)
                        )
                    } else {
                        updates.push(
                            supabase
                                .from('group_members')
                                .insert({
                                    group_id: group.id,
                                    user_id: userId,
                                    display_order: displayOrder
                                })
                        )
                    }
                }
            }

            await Promise.all(updates)

            // 3. Audit Log
            await auditLogger.log({
                action: data.id ? 'UPDATE_SHIFT_PATTERN' : 'CREATE_SHIFT_CONFIG',
                target_type: 'SHIFT_CONFIG',
                target_id: configData.id,
                changes: {
                    valid_from: format(data.validFrom, 'yyyy-MM-dd'),
                    cycle_length: data.cycleLength,
                    teams: Object.keys(data.assignments).filter(k => k !== 'Unassigned'),
                    memo: data.memo
                }
            })

            onComplete()
        } catch (err: any) {
            console.error(err)
            setError(err.message || "저장 중 오류가 발생했습니다.")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="h-full flex flex-col gap-4">
            {/* Header & Navigation */}
            <div className="flex justify-between items-center bg-white p-2 rounded-lg border shadow-sm">
                <div className="px-2">
                    <h3 className="text-lg font-bold">설정 확인 및 저장</h3>
                    <p className="text-xs text-muted-foreground">
                        변경 사항을 최종 확인하고 저장합니다.
                    </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className="flex gap-2">

                        <Button
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={handleSave}
                            disabled={saving || !data.memo.trim()}
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    저장 중...
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    설정 저장하기
                                </>
                            )}
                        </Button>
                    </div>
                    {!data.memo.trim() && !saving && (
                        <span className="text-[10px] text-red-500 font-medium animate-pulse">
                            * 변경 사유를 입력해야 저장할 수 있습니다.
                        </span>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <div className="max-w-3xl mx-auto space-y-6 py-4">
                    <div className="grid gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">변경 요약</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground">적용 시작일:</span>
                                        <span className="ml-2 font-bold">{format(data.validFrom, 'yyyy-MM-dd')}</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">순환 주기:</span>
                                        <span className="ml-2 font-bold">{data.cycleLength}일</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">운영 조:</span>
                                        <span className="ml-2 font-bold">
                                            {Object.keys(data.assignments).filter(k => k !== 'Unassigned').length}개 조
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">총 근무자:</span>
                                        <span className="ml-2 font-bold">
                                            {Object.entries(data.assignments)
                                                .filter(([team]) => team !== 'Unassigned')
                                                .flatMap(([, workers]) => workers).length}명
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="space-y-2">
                            <Label>변경 사유 / 비고 (필수)</Label>
                            <Textarea
                                placeholder="예: 하계 휴가 기간 단축 운영, 신규 입사자 배치 등"
                                value={data.memo}
                                onChange={(e) => onChange({ ...data, memo: e.target.value })}
                                className={cn(
                                    "h-24 resize-none transition-all",
                                    !data.memo.trim()
                                        ? "border-blue-500 ring-2 ring-blue-200 animate-pulse"
                                        : "border-gray-300"
                                )}
                            />
                            <p className="text-xs text-muted-foreground">
                                * 나중에 이력을 파악하기 위해 구체적인 사유를 입력해주세요.
                            </p>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>오류 발생</AlertTitle>
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
