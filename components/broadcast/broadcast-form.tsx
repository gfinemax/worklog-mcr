"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useBroadcastStore, BroadcastSchedule } from "@/store/broadcast"
import { toast } from "sonner"

interface BroadcastFormProps {
    open: boolean
    onClose: () => void
    schedule?: BroadcastSchedule | null
    defaultDate?: string
}

const CHANNELS = ["SPORTS+", "ON", "FM", "M", "DRAMA", "Every1", "NET"]
const STUDIOS = ["ST-A", "ST-B", "ST-C", "ST-D", "ST-E"]

export function BroadcastForm({ open, onClose, schedule, defaultDate }: BroadcastFormProps) {
    const addSchedule = useBroadcastStore((state) => state.addSchedule)
    const updateSchedule = useBroadcastStore((state) => state.updateSchedule)
    const fetchSchedules = useBroadcastStore((state) => state.fetchSchedules)

    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        type: 'broadcast' as 'broadcast' | 'reception',
        date: defaultDate || format(new Date(), 'yyyy-MM-dd'),
        time: '',
        channel_name: '',
        studio_label: '',
        program_title: '',
        match_info: '',
        transmission_path: '',
        video_source_info: '',
        audio_source_info: '',
        send_line: '',
        hq_network: '',
        broadcast_van: '',
        manager: '',
        contact_info: '',
        biss_code: '',
        memo: ''
    })

    useEffect(() => {
        if (schedule) {
            setFormData({
                type: schedule.type,
                date: schedule.date,
                time: schedule.time.slice(0, 5),
                channel_name: schedule.channel_name,
                studio_label: schedule.studio_label || '',
                program_title: schedule.program_title,
                match_info: schedule.match_info || '',
                transmission_path: schedule.transmission_path || '',
                video_source_info: schedule.video_source_info || '',
                audio_source_info: schedule.audio_source_info || '',
                send_line: schedule.send_line || '',
                hq_network: schedule.hq_network || '',
                broadcast_van: schedule.broadcast_van || '',
                manager: schedule.manager || '',
                contact_info: schedule.contact_info || '',
                biss_code: schedule.biss_code || '',
                memo: schedule.memo || ''
            })
        } else {
            setFormData(prev => ({
                ...prev,
                type: 'broadcast',
                date: defaultDate || format(new Date(), 'yyyy-MM-dd'),
                time: '',
                channel_name: '',
                studio_label: '',
                program_title: '',
                match_info: '',
                transmission_path: '',
                video_source_info: '',
                audio_source_info: '',
                send_line: '',
                hq_network: '',
                broadcast_van: '',
                manager: '',
                contact_info: '',
                biss_code: '',
                memo: ''
            }))
        }
    }, [schedule, defaultDate, open])

    const handleSubmit = async () => {
        if (!formData.date || !formData.time || !formData.channel_name || !formData.program_title) {
            toast.error("필수 항목을 입력해주세요.")
            return
        }

        setLoading(true)

        try {
            if (schedule) {
                // Update
                const { error } = await updateSchedule(schedule.id, formData)
                if (error) throw error
                toast.success("수정되었습니다.")
            } else {
                // Create
                const result = await addSchedule(formData)
                if (!result) throw new Error("Failed to add schedule")
                toast.success("등록되었습니다.")
            }

            // Refresh
            await fetchSchedules(formData.date)
            onClose()
        } catch (error) {
            console.error('Error saving broadcast schedule:', error)
            toast.error("저장 중 오류가 발생했습니다.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {schedule ? '중계 일정 수정' : '새 중계 일정 추가'}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Row 1: Type, Date, Time */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>구분 *</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(value) => setFormData({ ...formData, type: value as 'broadcast' | 'reception' })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="broadcast">라이브</SelectItem>
                                    <SelectItem value="reception">수신</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>날짜 *</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !formData.date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {formData.date ? format(new Date(formData.date), 'yyyy-MM-dd') : '선택'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={formData.date ? new Date(formData.date) : undefined}
                                        onSelect={(date) => date && setFormData({ ...formData, date: format(date, 'yyyy-MM-dd') })}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label>시간 *</Label>
                            <Input
                                type="time"
                                value={formData.time}
                                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Row 2: Channel, Studio */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>채널 *</Label>
                            <Select
                                value={formData.channel_name}
                                onValueChange={(value) => setFormData({ ...formData, channel_name: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CHANNELS.map(ch => (
                                        <SelectItem key={ch} value={ch}>{ch}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>스튜디오</Label>
                            <Select
                                value={formData.studio_label}
                                onValueChange={(value) => setFormData({ ...formData, studio_label: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="선택 (선택사항)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">없음</SelectItem>
                                    {STUDIOS.map(st => (
                                        <SelectItem key={st} value={st}>{st}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Row 3: Program Title, Match Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>종목/프로그램 *</Label>
                            <Input
                                value={formData.program_title}
                                onChange={(e) => setFormData({ ...formData, program_title: e.target.value })}
                                placeholder="예: 컬링슈퍼리그, WKBL, PBA"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>경기 정보</Label>
                            <Input
                                value={formData.match_info}
                                onChange={(e) => setFormData({ ...formData, match_info: e.target.value })}
                                placeholder="예: 신한은행:하나은행"
                            />
                        </div>
                    </div>

                    {/* Row 4: Transmission Path, Video Source */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>수신 경로</Label>
                            <Input
                                value={formData.transmission_path}
                                onChange={(e) => setFormData({ ...formData, transmission_path: e.target.value })}
                                placeholder="예: IP RET-1 : FA1AO"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>송신 라인</Label>
                            <Input
                                value={formData.video_source_info}
                                onChange={(e) => setFormData({ ...formData, video_source_info: e.target.value })}
                                placeholder="예: FA 3A-O, X100-1"
                            />
                        </div>
                    </div>

                    {/* Row 5: HQ Network, Broadcast Van */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>본사망</Label>
                            <Input
                                value={formData.hq_network}
                                onChange={(e) => setFormData({ ...formData, hq_network: e.target.value })}
                                placeholder="예: NCC TX-9"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>중계차</Label>
                            <Input
                                value={formData.broadcast_van}
                                onChange={(e) => setFormData({ ...formData, broadcast_van: e.target.value })}
                                placeholder="예: 중계차명, 담당자"
                            />
                        </div>
                    </div>

                    {/* Row 6: Manager, Contact */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>담당자</Label>
                            <Input
                                value={formData.manager}
                                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>연락처</Label>
                            <Input
                                value={formData.contact_info}
                                onChange={(e) => setFormData({ ...formData, contact_info: e.target.value })}
                                placeholder="010-0000-0000"
                            />
                        </div>
                    </div>

                    {/* Row 7: BISS Code */}
                    <div className="space-y-2">
                        <Label>BISS 코드</Label>
                        <Input
                            value={formData.biss_code}
                            onChange={(e) => setFormData({ ...formData, biss_code: e.target.value })}
                            placeholder="예: 2E28F6B31D59"
                            className="font-mono"
                        />
                    </div>

                    {/* Row 8: Memo */}
                    <div className="space-y-2">
                        <Label>메모</Label>
                        <Textarea
                            value={formData.memo}
                            onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                            placeholder="기타 특이사항..."
                            rows={2}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        취소
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {schedule ? '수정' : '등록'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
