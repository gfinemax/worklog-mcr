"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
    CalendarIcon,
    Loader2,
    Check,
    Radio,
    Tv,
    Satellite,
    ArrowRight,
    ArrowLeft
} from "lucide-react"
import { useBroadcastStore, BroadcastSchedule } from "@/store/broadcast"
import {
    NETWORK_TYPES,
    CHANNELS,
    STUDIOS,
    getSourcesByNetworkType,
    getEquipmentsBySource,
    getTransmissionOptions,
    getReturnTypes,
    getReturnChannels,
    type NetworkType
} from "@/lib/network-config"
import { toast } from "sonner"

interface BroadcastWizardProps {
    open: boolean
    onClose: () => void
    schedule?: BroadcastSchedule | null
    defaultDate?: string
}

type WizardStep = 1 | 2 | 3 | 4

const STEP_TITLES = {
    1: '기본 정보',
    2: '프로그램',
    3: '신호 설정',
    4: '확인'
}

interface FormData {
    // Step 1: 기본 정보
    type: 'broadcast' | 'reception'
    date: string
    startTime: string
    endTime: string

    // Step 2: 프로그램 정보
    channels: string[]
    studio: string
    programTitle: string
    subtitle: string

    // Step 3: 신호 설정
    receptionMainType: NetworkType | ''
    receptionMainSource: string
    receptionMainEquipment: string
    receptionBackupType: NetworkType | ''
    receptionBackupSource: string
    receptionBackupEquipment: string
    transmission: string
    returnType: string
    returnChannel: string

    // Step 4: 추가 정보
    manager: string
    contactInfo: string
    broadcastVan: string
    bissCode: string
    memo: string
}

const initialFormData: FormData = {
    type: 'broadcast',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '',
    endTime: '',
    channels: [],
    studio: '',
    programTitle: '',
    subtitle: '',
    receptionMainType: '',
    receptionMainSource: '',
    receptionMainEquipment: '',
    receptionBackupType: '',
    receptionBackupSource: '',
    receptionBackupEquipment: '',
    transmission: '',
    returnType: '',
    returnChannel: '',
    manager: '',
    contactInfo: '',
    broadcastVan: '',
    bissCode: '',
    memo: '',
}

export function BroadcastWizard({ open, onClose, schedule, defaultDate }: BroadcastWizardProps) {
    const addSchedule = useBroadcastStore((state) => state.addSchedule)
    const updateSchedule = useBroadcastStore((state) => state.updateSchedule)
    const fetchSchedules = useBroadcastStore((state) => state.fetchSchedules)

    const [step, setStep] = useState<WizardStep>(1)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<FormData>(initialFormData)

    // Initialize form data
    useEffect(() => {
        if (schedule) {
            // Parse existing schedule data
            setFormData({
                type: schedule.type,
                date: schedule.date,
                startTime: schedule.time?.slice(0, 5) || '',
                endTime: '', // TODO: Add end_time to schema
                channels: schedule.channel_name ? schedule.channel_name.split(', ') : [],
                studio: schedule.studio_label || '',
                programTitle: schedule.program_title || '',
                subtitle: schedule.match_info || '',
                receptionMainType: '',
                receptionMainSource: '',
                receptionMainEquipment: '',
                receptionBackupType: '',
                receptionBackupSource: '',
                receptionBackupEquipment: '',
                transmission: schedule.video_source_info || '',
                returnType: '',
                returnChannel: schedule.return_info || '',
                manager: schedule.manager || '',
                contactInfo: schedule.contact_info || '',
                broadcastVan: schedule.broadcast_van || '',
                bissCode: schedule.biss_code || '',
                memo: schedule.memo || '',
            })
        } else {
            setFormData({
                ...initialFormData,
                date: defaultDate || format(new Date(), 'yyyy-MM-dd'),
            })
        }
        setStep(1)
    }, [schedule, defaultDate, open])

    const canProceed = (): boolean => {
        switch (step) {
            case 1:
                return !!formData.date && !!formData.startTime
            case 2:
                return formData.channels.length > 0 && !!formData.programTitle
            case 3:
                return true // Optional fields
            case 4:
                return true
            default:
                return false
        }
    }

    const handleNext = () => {
        if (step < 4 && canProceed()) {
            setStep((step + 1) as WizardStep)
        }
    }

    const handlePrev = () => {
        if (step > 1) {
            setStep((step - 1) as WizardStep)
        }
    }

    const handleSubmit = async () => {
        setLoading(true)

        try {
            // Ensure time is in HH:MM:SS format
            const formattedTime = formData.startTime.length === 5
                ? `${formData.startTime}:00`
                : formData.startTime

            const scheduleData = {
                type: formData.type,
                date: formData.date,
                time: formattedTime,
                channel_name: formData.channels.join(', '),
                studio_label: formData.studio || undefined,
                program_title: formData.programTitle,
                match_info: formData.subtitle || undefined,
                transmission_path: formData.receptionMainEquipment
                    ? `${formData.receptionMainType} > ${formData.receptionMainSource} > ${formData.receptionMainEquipment}`
                    : undefined,
                video_source_info: formData.transmission || undefined,
                return_info: formData.returnChannel || undefined,
                manager: formData.manager || undefined,
                contact_info: formData.contactInfo || undefined,
                broadcast_van: formData.broadcastVan || undefined,
                biss_code: formData.bissCode || undefined,
                memo: formData.memo || undefined,
            }

            if (schedule) {
                const { error } = await updateSchedule(schedule.id, scheduleData)
                if (error) throw error
                toast.success("수정되었습니다.")
            } else {
                const result = await addSchedule(scheduleData)
                if (!result) throw new Error("Failed to add schedule")
                toast.success("등록되었습니다.")
            }

            await fetchSchedules(formData.date)
            onClose()
        } catch (error) {
            console.error('Error saving broadcast schedule:', error)
            toast.error("저장 중 오류가 발생했습니다.")
        } finally {
            setLoading(false)
        }
    }

    const toggleChannel = (channel: string) => {
        setFormData(prev => ({
            ...prev,
            channels: prev.channels.includes(channel)
                ? prev.channels.filter(c => c !== channel)
                : [...prev.channels, channel]
        }))
    }

    // Render step indicator
    const renderStepIndicator = () => (
        <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center">
                    <button
                        onClick={() => s < step && setStep(s as WizardStep)}
                        disabled={s > step}
                        className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all",
                            s === step
                                ? "bg-primary text-primary-foreground"
                                : s < step
                                    ? "bg-green-500 text-white cursor-pointer hover:bg-green-600"
                                    : "bg-muted text-muted-foreground"
                        )}
                    >
                        {s < step ? <Check className="w-4 h-4" /> : s}
                    </button>
                    {s < 4 && (
                        <div className={cn(
                            "w-12 h-1 mx-1 rounded",
                            s < step ? "bg-green-500" : "bg-muted"
                        )} />
                    )}
                </div>
            ))}
        </div>
    )

    // Step 1: 기본 정보
    const renderStep1 = () => (
        <div className="space-y-6">
            {/* 구분 */}
            <div className="space-y-3">
                <Label className="text-base font-semibold">구분</Label>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type: 'broadcast' }))}
                        className={cn(
                            "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all",
                            formData.type === 'broadcast'
                                ? "border-red-500 bg-red-50 text-red-700"
                                : "border-muted hover:border-muted-foreground/50"
                        )}
                    >
                        <Radio className="w-8 h-8 mb-2" />
                        <span className="font-medium">🔴 라이브</span>
                        <span className="text-xs text-muted-foreground">외부 생중계</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, type: 'reception' }))}
                        className={cn(
                            "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all",
                            formData.type === 'reception'
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-muted hover:border-muted-foreground/50"
                        )}
                    >
                        <Satellite className="w-8 h-8 mb-2" />
                        <span className="font-medium">🔵 수신</span>
                        <span className="text-xs text-muted-foreground">신호 수신</span>
                    </button>
                </div>
            </div>

            {/* 날짜 & 시간 */}
            <div className="grid grid-cols-3 gap-4">
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
                                onSelect={(date) => date && setFormData(prev => ({
                                    ...prev,
                                    date: format(date, 'yyyy-MM-dd')
                                }))}
                                locale={ko}
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="space-y-2">
                    <Label>시작 시간 *</Label>
                    <Input
                        type="time"
                        value={formData.startTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    />
                </div>

                <div className="space-y-2">
                    <Label>종료 시간</Label>
                    <Input
                        type="time"
                        value={formData.endTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    />
                </div>
            </div>
        </div>
    )

    // Step 2: 프로그램 정보
    const renderStep2 = () => (
        <div className="space-y-6">
            {/* 채널 선택 */}
            <div className="space-y-3">
                <Label className="text-base font-semibold">채널 선택 *</Label>
                <div className="flex flex-wrap gap-2">
                    {CHANNELS.map((channel) => (
                        <button
                            key={channel}
                            type="button"
                            onClick={() => toggleChannel(channel)}
                            className={cn(
                                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                                formData.channels.includes(channel)
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted hover:bg-muted/80"
                            )}
                        >
                            {formData.channels.includes(channel) && <Check className="inline w-4 h-4 mr-1" />}
                            {channel}
                        </button>
                    ))}
                </div>
            </div>

            {/* 스튜디오 */}
            <div className="space-y-3">
                <Label className="text-base font-semibold">스튜디오</Label>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, studio: '' }))}
                        className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium transition-all",
                            formData.studio === ''
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-muted/80"
                        )}
                    >
                        해당없음
                    </button>
                    {STUDIOS.map((studio) => (
                        <button
                            key={studio}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, studio }))}
                            className={cn(
                                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                                formData.studio === studio
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted hover:bg-muted/80"
                            )}
                        >
                            {studio}
                        </button>
                    ))}
                </div>
            </div>

            {/* 프로그램명 */}
            <div className="space-y-2">
                <Label>종목/프로그램 *</Label>
                <Input
                    value={formData.programTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, programTitle: e.target.value }))}
                    placeholder="예: 호주프로야구, V리그, PBA"
                />
            </div>

            {/* 부제 */}
            <div className="space-y-2">
                <Label>부제 (경기 정보)</Label>
                <Input
                    value={formData.subtitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="예: <질롱코리아 : 캔버라>"
                />
            </div>
        </div>
    )

    // Step 3: 신호 설정
    const renderStep3 = () => {
        const mainSources = formData.receptionMainType ? getSourcesByNetworkType(formData.receptionMainType) : []
        const mainEquipments = formData.receptionMainType && formData.receptionMainSource
            ? getEquipmentsBySource(formData.receptionMainType, formData.receptionMainSource)
            : []

        const backupSources = formData.receptionBackupType ? getSourcesByNetworkType(formData.receptionBackupType) : []
        const backupEquipments = formData.receptionBackupType && formData.receptionBackupSource
            ? getEquipmentsBySource(formData.receptionBackupType, formData.receptionBackupSource)
            : []

        const returnChannels = formData.returnType ? getReturnChannels(formData.returnType) : []

        return (
            <div className="space-y-6">
                {/* 메인 수신 */}
                <div className="space-y-3 p-4 rounded-lg border-2 border-blue-200 bg-blue-50/50">
                    <Label className="text-base font-semibold text-blue-700">🔵 메인 수신</Label>
                    <div className="grid grid-cols-3 gap-3">
                        <Select
                            value={formData.receptionMainType}
                            onValueChange={(value) => setFormData(prev => ({
                                ...prev,
                                receptionMainType: value as NetworkType,
                                receptionMainSource: '',
                                receptionMainEquipment: ''
                            }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="망종류" />
                            </SelectTrigger>
                            <SelectContent>
                                {NETWORK_TYPES.map(type => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={formData.receptionMainSource}
                            onValueChange={(value) => setFormData(prev => ({
                                ...prev,
                                receptionMainSource: value,
                                receptionMainEquipment: ''
                            }))}
                            disabled={!formData.receptionMainType}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="소스/장비" />
                            </SelectTrigger>
                            <SelectContent>
                                {mainSources.map(source => (
                                    <SelectItem key={source} value={source}>{source}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={formData.receptionMainEquipment}
                            onValueChange={(value) => setFormData(prev => ({
                                ...prev,
                                receptionMainEquipment: value
                            }))}
                            disabled={!formData.receptionMainSource}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="출력/채널" />
                            </SelectTrigger>
                            <SelectContent>
                                {mainEquipments.map(eq => (
                                    <SelectItem key={eq.id} value={eq.label}>{eq.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* 백업 수신 */}
                <div className="space-y-3 p-4 rounded-lg border-2 border-yellow-200 bg-yellow-50/50">
                    <Label className="text-base font-semibold text-yellow-700">🟡 백업 수신</Label>
                    <div className="grid grid-cols-3 gap-3">
                        <Select
                            value={formData.receptionBackupType}
                            onValueChange={(value) => setFormData(prev => ({
                                ...prev,
                                receptionBackupType: value as NetworkType,
                                receptionBackupSource: '',
                                receptionBackupEquipment: ''
                            }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="망종류" />
                            </SelectTrigger>
                            <SelectContent>
                                {NETWORK_TYPES.map(type => (
                                    <SelectItem key={type} value={type}>{type}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={formData.receptionBackupSource}
                            onValueChange={(value) => setFormData(prev => ({
                                ...prev,
                                receptionBackupSource: value,
                                receptionBackupEquipment: ''
                            }))}
                            disabled={!formData.receptionBackupType}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="소스/장비" />
                            </SelectTrigger>
                            <SelectContent>
                                {backupSources.map(source => (
                                    <SelectItem key={source} value={source}>{source}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={formData.receptionBackupEquipment}
                            onValueChange={(value) => setFormData(prev => ({
                                ...prev,
                                receptionBackupEquipment: value
                            }))}
                            disabled={!formData.receptionBackupSource}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="출력/채널" />
                            </SelectTrigger>
                            <SelectContent>
                                {backupEquipments.map(eq => (
                                    <SelectItem key={eq.id} value={eq.label}>{eq.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* 송신 / 리턴 */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>📤 송신</Label>
                        <Select
                            value={formData.transmission}
                            onValueChange={(value) => setFormData(prev => ({ ...prev, transmission: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="송신 경로 선택" />
                            </SelectTrigger>
                            <SelectContent>
                                {getTransmissionOptions().map(opt => (
                                    <SelectItem key={opt.id} value={opt.label}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>🔄 리턴</Label>
                        <div className="flex gap-2">
                            <Select
                                value={formData.returnType}
                                onValueChange={(value) => setFormData(prev => ({
                                    ...prev,
                                    returnType: value,
                                    returnChannel: ''
                                }))}
                            >
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="종류" />
                                </SelectTrigger>
                                <SelectContent>
                                    {getReturnTypes().map(type => (
                                        <SelectItem key={type} value={type}>{type}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select
                                value={formData.returnChannel}
                                onValueChange={(value) => setFormData(prev => ({ ...prev, returnChannel: value }))}
                                disabled={!formData.returnType}
                            >
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder="채널" />
                                </SelectTrigger>
                                <SelectContent>
                                    {returnChannels.map(ch => (
                                        <SelectItem key={ch.id} value={ch.label}>{ch.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Step 4: 확인 및 저장
    const renderStep4 = () => (
        <div className="space-y-6">
            {/* 요약 */}
            <div className="p-4 rounded-lg bg-muted space-y-3">
                <h4 className="font-semibold">📋 입력 내용 확인</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                        <span className="text-muted-foreground">구분:</span>{' '}
                        <span className={formData.type === 'broadcast' ? 'text-red-600' : 'text-blue-600'}>
                            {formData.type === 'broadcast' ? '🔴 라이브' : '🔵 수신'}
                        </span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">날짜:</span> {formData.date}
                    </div>
                    <div>
                        <span className="text-muted-foreground">시간:</span> {formData.startTime}
                        {formData.endTime && ` ~ ${formData.endTime}`}
                    </div>
                    <div>
                        <span className="text-muted-foreground">채널:</span> {formData.channels.join(', ')}
                    </div>
                    <div className="col-span-2">
                        <span className="text-muted-foreground">프로그램:</span> {formData.programTitle}
                        {formData.subtitle && ` (${formData.subtitle})`}
                    </div>
                    {formData.receptionMainEquipment && (
                        <div className="col-span-2">
                            <span className="text-muted-foreground">메인 수신:</span>{' '}
                            {formData.receptionMainType} &gt; {formData.receptionMainSource} &gt; {formData.receptionMainEquipment}
                        </div>
                    )}
                    {formData.receptionBackupEquipment && (
                        <div className="col-span-2">
                            <span className="text-muted-foreground">백업 수신:</span>{' '}
                            {formData.receptionBackupType} &gt; {formData.receptionBackupSource} &gt; {formData.receptionBackupEquipment}
                        </div>
                    )}
                    {formData.transmission && (
                        <div>
                            <span className="text-muted-foreground">송신:</span> {formData.transmission}
                        </div>
                    )}
                    {formData.returnChannel && (
                        <div>
                            <span className="text-muted-foreground">리턴:</span> {formData.returnChannel}
                        </div>
                    )}
                </div>
            </div>

            {/* 추가 정보 */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>담당자</Label>
                    <Input
                        value={formData.manager}
                        onChange={(e) => setFormData(prev => ({ ...prev, manager: e.target.value }))}
                    />
                </div>
                <div className="space-y-2">
                    <Label>연락처</Label>
                    <Input
                        value={formData.contactInfo}
                        onChange={(e) => setFormData(prev => ({ ...prev, contactInfo: e.target.value }))}
                        placeholder="010-0000-0000"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>중계차</Label>
                    <Input
                        value={formData.broadcastVan}
                        onChange={(e) => setFormData(prev => ({ ...prev, broadcastVan: e.target.value }))}
                    />
                </div>
                <div className="space-y-2">
                    <Label>BISS 코드</Label>
                    <Input
                        value={formData.bissCode}
                        onChange={(e) => setFormData(prev => ({ ...prev, bissCode: e.target.value }))}
                        className="font-mono"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>메모</Label>
                <Textarea
                    value={formData.memo}
                    onChange={(e) => setFormData(prev => ({ ...prev, memo: e.target.value }))}
                    rows={2}
                />
            </div>
        </div>
    )

    return (
        <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        {schedule ? '중계 일정 수정' : '중계 일정 등록'}
                    </DialogTitle>
                </DialogHeader>

                {/* Step Indicator */}
                {renderStepIndicator()}

                {/* Step Title */}
                <div className="text-center text-sm text-muted-foreground mb-4">
                    Step {step}. {STEP_TITLES[step]}
                </div>

                {/* Step Content */}
                <div className="min-h-[300px]">
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                    {step === 4 && renderStep4()}
                </div>

                {/* Bottom Progress & Buttons */}
                <div className="border-t pt-4 mt-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {[1, 2, 3, 4].map((s) => (
                                <div
                                    key={s}
                                    className={cn(
                                        "w-16 h-1 rounded-full transition-all",
                                        s <= step ? "bg-primary" : "bg-muted"
                                    )}
                                />
                            ))}
                            <span className="text-sm text-muted-foreground ml-2">
                                {step}/4
                            </span>
                        </div>

                        <div className="flex gap-2">
                            {step > 1 && (
                                <Button variant="outline" onClick={handlePrev} disabled={loading}>
                                    <ArrowLeft className="w-4 h-4 mr-1" />
                                    이전
                                </Button>
                            )}
                            {step < 4 ? (
                                <Button onClick={handleNext} disabled={!canProceed()}>
                                    다음
                                    <ArrowRight className="w-4 h-4 ml-1" />
                                </Button>
                            ) : (
                                <Button onClick={handleSubmit} disabled={loading}>
                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {schedule ? '수정 완료' : '등록 완료'}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
