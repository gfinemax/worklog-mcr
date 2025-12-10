"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
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
    ArrowLeft,
    X,
    ChevronsUpDown,
    Plus,
    Settings
} from "lucide-react"
import { useBroadcastStore, BroadcastSchedule } from "@/store/broadcast"
import { useContactsStore, Contact } from "@/store/contacts"
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
import Link from "next/link"

interface BroadcastWizardProps {
    open: boolean
    onClose: () => void
    schedule?: BroadcastSchedule | null
    defaultDate?: string
}

type WizardStep = 1 | 2 | 3

const STEP_TITLES = {
    1: '기본 정보',
    2: '신호 설정',
    3: '확인'
}

// 전화번호 자동 포맷 (010-1234-5678)
const formatPhoneNumber = (value: string): string => {
    const numbers = value.replace(/[^\d]/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
}

// 개별 신호 설정
interface SignalConfig {
    id: string
    type: NetworkType | ''
    source: string
    equipment: string
}

// 신호 ID 생성
const generateSignalId = () => `signal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// 빈 신호 생성
const createEmptySignal = (): SignalConfig => ({
    id: generateSignalId(),
    type: '',
    source: '',
    equipment: ''
})

// 기본 4개 신호 생성
const createDefaultSignals = (): SignalConfig[] => [
    createEmptySignal(),
    createEmptySignal(),
    createEmptySignal(),
    createEmptySignal()
]

interface FormData {
    // Step 1: 기본 정보
    type: 'broadcast' | 'reception'
    date: string
    startTime: string
    endTime: string
    duration?: number  // 방송 시간 (분)

    // Step 2: 프로그램 정보
    channels: string[]
    studio: string
    programTitle: string
    subtitle: string

    // Step 3: 신호 설정 (동적)
    signals: SignalConfig[]   // 신호 목록
    mainSignalId: string      // 메인으로 선택된 신호 ID

    // Step 3: 송신/리턴 (복수 선택)
    receptionText: string     // 수신 직접 입력
    transmissions: string[]   // 송신 목록
    returns: string[]         // 리턴 목록 (종류 > 채널 형태)

    // Step 4: 추가 정보
    manager: string
    contactInfo: string
    broadcastVan: string
    bissCode: string
    memo: string
}

const createInitialFormData = (defaultDate?: string): FormData => {
    const signals = createDefaultSignals()
    return {
        type: 'broadcast',
        date: defaultDate || format(new Date(), 'yyyy-MM-dd'),
        startTime: '',
        endTime: '',
        channels: [],
        studio: '',
        programTitle: '',
        subtitle: '',
        signals,
        mainSignalId: signals[0].id, // 첫 번째 신호가 기본 메인
        receptionText: '',
        transmissions: [],
        returns: [],
        manager: '',
        contactInfo: '',
        broadcastVan: '',
        bissCode: '',
        memo: '',
    }
}

// Helper function to parse transmission_path like "IP > LiveU > FA3AO (1-1)"
function parseReceptionPath(path: string | undefined): SignalConfig[] {
    if (!path) return createDefaultSignals()

    // 메인: IP > LiveU > FA3AO / 백업: 광수신 > LG FS > LG FS-1 형태 파싱
    const signals: SignalConfig[] = []
    const sections = path.split(' / ').map(s => s.trim())

    for (const section of sections) {
        const cleanSection = section.replace(/^(메인|백업):\s*/, '')
        const parts = cleanSection.split(' > ').map(p => p.trim())
        if (parts.length >= 3) {
            signals.push({
                id: generateSignalId(),
                type: parts[0] as NetworkType,
                source: parts[1],
                equipment: parts[2]
            })
        }
    }

    // 최소 4개 신호 보장
    while (signals.length < 4) {
        signals.push(createEmptySignal())
    }

    return signals
}

export function BroadcastWizard({ open, onClose, schedule, defaultDate }: BroadcastWizardProps) {
    const addSchedule = useBroadcastStore((state) => state.addSchedule)
    const updateSchedule = useBroadcastStore((state) => state.updateSchedule)
    const fetchSchedules = useBroadcastStore((state) => state.fetchSchedules)

    // Contacts store
    const { contacts, fetchContacts, addContact } = useContactsStore()
    const [contactsOpen, setContactsOpen] = useState(false)
    const [newContactDialogOpen, setNewContactDialogOpen] = useState(false)
    const [newContactForm, setNewContactForm] = useState({ name: "", phone: "", organization: "" })
    const [addingContact, setAddingContact] = useState(false)

    // Fetch contacts on mount
    useEffect(() => {
        fetchContacts()
    }, [fetchContacts])

    const [step, setStep] = useState<WizardStep>(1)
    const [loading, setLoading] = useState(false)

    // 드래그 상태
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

    // 드래그 핸들러
    const handleMouseDown = (e: React.MouseEvent) => {
        // 입력 요소나 상호작용 요소에서는 드래그 시작하지 않음
        const interactiveElements = 'button, input, select, textarea, label, [role="button"], [role="combobox"], [data-radix-collection-item]'
        if ((e.target as HTMLElement).closest(interactiveElements)) return

        // 스크롤 영역 내부에서는 드래그 시작하지 않음
        const scrollContainer = (e.target as HTMLElement).closest('.overflow-y-auto, .overflow-auto')
        if (scrollContainer && scrollContainer !== e.currentTarget) return

        setIsDragging(true)
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        })
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }
    const [formData, setFormData] = useState<FormData>(() => createInitialFormData())

    // Initialize form data
    useEffect(() => {
        if (schedule) {
            // Parse existing schedule data
            const parsedSignals = parseReceptionPath(schedule.transmission_path)

            // 수신 텍스트 생성 (메인/백업 형식)
            const receptionTextParts: string[] = []
            const mainSignal = parsedSignals[0]
            const backupSignals = parsedSignals.slice(1).filter(s => s.equipment)
            if (mainSignal?.equipment) {
                receptionTextParts.push(`(M)${mainSignal.equipment}`)
            }
            if (backupSignals.length > 0) {
                receptionTextParts.push(`(B)${backupSignals.map(s => s.equipment).join(' ')}`)
            }

            setFormData({
                type: schedule.type,
                date: schedule.date,
                startTime: schedule.time?.slice(0, 5) || '',
                endTime: schedule.end_time?.slice(0, 5) || '',
                channels: schedule.channel_name ? schedule.channel_name.split(', ') : [],
                studio: schedule.studio_label || '',
                programTitle: schedule.program_title || '',
                subtitle: schedule.match_info || '',
                signals: parsedSignals,
                mainSignalId: parsedSignals[0]?.id || '',
                receptionText: receptionTextParts.join(' '),
                transmissions: schedule.video_source_info ? schedule.video_source_info.split(', ').filter(s => s.trim()) : [],
                returns: schedule.return_info ? schedule.return_info.split(', ').filter(s => s.trim()) : [],
                manager: schedule.manager || '',
                contactInfo: schedule.contact_info || '',
                broadcastVan: schedule.broadcast_van || '',
                bissCode: schedule.biss_code || '',
                memo: schedule.memo || '',
            })
        } else {
            setFormData(createInitialFormData(defaultDate))
        }
        setStep(1)
        setPosition({ x: 0, y: 0 }) // 모달 열릴 때 중앙으로 초기화
    }, [schedule, defaultDate, open])

    // signals 변경 시 receptionText 자동 업데이트
    useEffect(() => {
        const mainSignal = formData.signals.find(s => s.id === formData.mainSignalId)
        const backupSignals = formData.signals.filter(s => s.id !== formData.mainSignalId && s.equipment)
        const parts: string[] = []
        if (mainSignal?.equipment) {
            parts.push(`(M)${mainSignal.equipment}`)
        }
        if (backupSignals.length > 0) {
            parts.push(`(B)${backupSignals.map(s => s.equipment).join(' ')}`)
        }
        const newReceptionText = parts.join(' ')
        if (newReceptionText !== formData.receptionText && newReceptionText) {
            setFormData(prev => ({ ...prev, receptionText: newReceptionText }))
        }
    }, [formData.signals, formData.mainSignalId])

    const canProceed = (): boolean => {
        switch (step) {
            case 1:
                // 수신 타입일 때는 채널 선택 불필요
                const channelRequired = formData.type === 'broadcast' ? formData.channels.length > 0 : true
                return !!formData.date && !!formData.startTime && channelRequired && !!formData.programTitle
            case 2:
                return true // Optional fields
            case 3:
                return true
            default:
                return false
        }
    }

    const handleNext = () => {
        if (step < 3 && canProceed()) {
            setStep((step + 1) as WizardStep)
        }
    }

    const handlePrev = () => {
        if (step > 1) {
            setStep((step - 1) as WizardStep)
        }
    }

    // 신호 추가
    const addSignal = () => {
        setFormData(prev => ({
            ...prev,
            signals: [...prev.signals, createEmptySignal()]
        }))
    }

    // 신호 삭제 (최소 1개 유지)
    const removeSignal = (signalId: string) => {
        if (formData.signals.length <= 1) return

        setFormData(prev => {
            const newSignals = prev.signals.filter(s => s.id !== signalId)
            // 삭제된 신호가 메인이면 첫 번째 신호를 메인으로
            const newMainId = prev.mainSignalId === signalId
                ? newSignals[0]?.id || ''
                : prev.mainSignalId
            return {
                ...prev,
                signals: newSignals,
                mainSignalId: newMainId
            }
        })
    }

    // 신호 수정
    const updateSignal = (signalId: string, field: keyof SignalConfig, value: string) => {
        setFormData(prev => ({
            ...prev,
            signals: prev.signals.map(s => {
                if (s.id !== signalId) return s

                // 타입 변경 시 소스와 장비 초기화
                if (field === 'type') {
                    return { ...s, type: value as NetworkType | '', source: '', equipment: '' }
                }
                // 소스 변경 시 장비 초기화
                if (field === 'source') {
                    return { ...s, source: value, equipment: '' }
                }
                return { ...s, [field]: value }
            })
        }))
    }

    // 메인 신호 선택
    const setMainSignal = (signalId: string) => {
        setFormData(prev => ({ ...prev, mainSignalId: signalId }))
    }

    const handleSubmit = async () => {
        setLoading(true)

        try {
            // Ensure time is in HH:MM:SS format
            const formattedTime = formData.startTime.length === 5
                ? `${formData.startTime}:00`
                : formData.startTime

            // 신호 정보를 문자열로 변환 (메인/백업 구분)
            const mainSignal = formData.signals.find(s => s.id === formData.mainSignalId)
            const backupSignals = formData.signals.filter(s => s.id !== formData.mainSignalId && s.equipment)

            // receptionText가 있으면 그것을 저장, 없으면 signals 기반으로 생성
            let transmissionPath = ''
            if (formData.receptionText.trim()) {
                // 직접 입력한 경우: 형식을 저장용으로 변환
                transmissionPath = formData.receptionText.trim()
            } else if (mainSignal?.equipment) {
                transmissionPath = `메인: ${mainSignal.type} > ${mainSignal.source} > ${mainSignal.equipment}`
                if (backupSignals.length > 0) {
                    const backupPaths = backupSignals.map(s => `${s.type} > ${s.source} > ${s.equipment}`)
                    transmissionPath += ` / 백업: ${backupPaths.join(', ')}`
                }
            }

            const scheduleData = {
                type: formData.type,
                date: formData.date,
                time: formattedTime,
                end_time: formData.endTime ? (formData.endTime.length === 5 ? `${formData.endTime}:00` : formData.endTime) : undefined,
                channel_name: formData.channels.length > 0 ? formData.channels.join(', ') : '',
                studio_label: formData.studio || null,
                program_title: formData.programTitle,
                match_info: formData.subtitle || null,
                transmission_path: transmissionPath || null,
                video_source_info: formData.transmissions.length > 0 ? formData.transmissions.join(', ') : null,
                return_info: formData.returns.length > 0 ? formData.returns.join(', ') : null,
                manager: formData.manager || null,
                contact_info: formData.contactInfo || null,
                broadcast_van: formData.broadcastVan || null,
                biss_code: formData.bissCode || null,
                memo: formData.memo || null,
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
            console.error('Schedule data that caused error:', JSON.stringify(formData, null, 2))
            toast.error(`저장 중 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
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
    const renderStepIndicator = () => {
        const isReady = canProceed()
        const nextStep = step + 1

        return (
            <div className="flex items-center justify-center gap-2 mb-6">
                {[1, 2, 3].map((s) => {
                    // 다음 스텝이고 진행 가능할 때 점멸 효과
                    const isPulsingNext = s === nextStep && isReady && step < 3

                    return (
                        <div key={s} className="flex items-center">
                            <button
                                onClick={() => {
                                    if (s < step) {
                                        setStep(s as WizardStep)
                                    } else if (s === nextStep && isReady) {
                                        setStep(s as WizardStep)
                                    }
                                }}
                                disabled={s > step && !isPulsingNext}
                                className={cn(
                                    "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all",
                                    s === step
                                        ? "bg-primary text-primary-foreground"
                                        : s < step
                                            ? "bg-green-500 text-white cursor-pointer hover:bg-green-600"
                                            : isPulsingNext
                                                ? "bg-green-400 text-white cursor-pointer animate-pulse ring-2 ring-green-300 ring-offset-2"
                                                : "bg-muted text-muted-foreground"
                                )}
                            >
                                {s < step ? <Check className="w-4 h-4" /> : s}
                            </button>
                            {s < 3 && (
                                <div className={cn(
                                    "w-12 h-1 mx-1 rounded transition-all",
                                    s < step ? "bg-green-500" : isPulsingNext ? "bg-green-300 animate-pulse" : "bg-muted"
                                )} />
                            )}
                        </div>
                    )
                })}
            </div>
        )
    }

    // Step 1: 기본 정보
    const renderStep1 = () => (
        <div className="space-y-6">
            {/* 구분 */}
            <div className="flex justify-center gap-4">
                <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'broadcast' }))}
                    className={cn(
                        "flex items-center gap-3 px-8 py-4 rounded-xl border-2 transition-all",
                        formData.type === 'broadcast'
                            ? "border-red-500 bg-red-50 text-red-700"
                            : "border-muted hover:border-red-300"
                    )}
                >
                    <Radio className="w-6 h-6" />
                    <span className="text-lg font-semibold">🔴 라이브</span>
                </button>
                <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type: 'reception' }))}
                    className={cn(
                        "flex items-center gap-3 px-8 py-4 rounded-xl border-2 transition-all",
                        formData.type === 'reception'
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-muted hover:border-blue-300"
                    )}
                >
                    <Satellite className="w-6 h-6" />
                    <span className="text-lg font-semibold">🔵 수신</span>
                </button>
            </div>

            {/* 날짜 & 시간 */}
            <div className="flex gap-4">
                <div className="space-y-2 w-[160px]">
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

                <div className="space-y-2 w-[100px]">
                    <Label>시작 시간 *</Label>
                    <Select
                        value={formData.startTime}
                        onValueChange={(value) => {
                            setFormData(prev => {
                                // 방송시간이 설정되어 있으면 종료시간 자동 계산
                                if (prev.duration && value) {
                                    const [h, m] = value.split(':').map(Number)
                                    const totalMins = h * 60 + m + prev.duration
                                    const endH = Math.floor(totalMins / 60) % 24
                                    const endM = totalMins % 60
                                    return {
                                        ...prev,
                                        startTime: value,
                                        endTime: `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`
                                    }
                                }
                                return { ...prev, startTime: value }
                            })
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="선택" />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 48 }, (_, i) => {
                                const h = Math.floor(i / 2)
                                const m = (i % 2) * 30
                                const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
                                return <SelectItem key={time} value={time}>{time}</SelectItem>
                            })}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2 w-[130px]">
                    <Label>방송 시간</Label>
                    <Select
                        value={formData.duration?.toString() || ""}
                        onValueChange={(value) => {
                            const duration = parseInt(value)
                            setFormData(prev => {
                                if (prev.startTime && prev.startTime.length === 5 && duration) {
                                    const [h, m] = prev.startTime.split(':').map(Number)
                                    if (!isNaN(h) && !isNaN(m)) {
                                        const totalMins = h * 60 + m + duration
                                        const endH = Math.floor(totalMins / 60) % 24
                                        const endM = totalMins % 60
                                        return {
                                            ...prev,
                                            duration,
                                            endTime: `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`
                                        }
                                    }
                                }
                                return { ...prev, duration }
                            })
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="선택" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="30">30분</SelectItem>
                            <SelectItem value="60">1시간</SelectItem>
                            <SelectItem value="90">1시간 30분</SelectItem>
                            <SelectItem value="120">2시간</SelectItem>
                            <SelectItem value="150">2시간 30분</SelectItem>
                            <SelectItem value="180">3시간</SelectItem>
                            <SelectItem value="210">3시간 30분</SelectItem>
                            <SelectItem value="240">4시간</SelectItem>
                            <SelectItem value="300">5시간</SelectItem>
                            <SelectItem value="360">6시간</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2 w-[100px]">
                    <Label>종료 시간</Label>
                    <Input
                        placeholder="11:00"
                        value={formData.endTime}
                        onChange={(e) => {
                            let value = e.target.value.replace(/[^\d:]/g, '')
                            if (value.length === 2 && !value.includes(':')) {
                                value = value + ':'
                            }
                            if (value.length > 5) value = value.slice(0, 5)
                            setFormData(prev => ({ ...prev, endTime: value, duration: undefined }))
                        }}
                    />
                </div>
            </div>

            {/* 채널 */}
            <div className="space-y-2">
                <Label className="font-semibold">채널 {formData.type === 'broadcast' && '*'}</Label>
                <div className="flex flex-wrap gap-1.5">
                    {CHANNELS.map((channel) => (
                        <button
                            key={channel}
                            type="button"
                            onClick={() => toggleChannel(channel)}
                            className={cn(
                                "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                                formData.channels.includes(channel)
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted hover:bg-muted/80"
                            )}
                        >
                            {formData.channels.includes(channel) && <Check className="inline w-3 h-3 mr-0.5" />}
                            {channel}
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, channels: [] }))}
                        className={cn(
                            "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                            formData.channels.length === 0
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-muted/80"
                        )}
                    >
                        해당없음
                    </button>
                </div>
            </div>

            {/* 스튜디오 */}
            <div className="space-y-2">
                <Label>스튜디오</Label>
                <div className="flex flex-wrap gap-1.5">
                    {STUDIOS.map((studio) => (
                        <button
                            key={studio}
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, studio }))}
                            className={cn(
                                "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                                formData.studio === studio
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted hover:bg-muted/80"
                            )}
                        >
                            {studio}
                        </button>
                    ))}
                    <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, studio: '' }))}
                        className={cn(
                            "px-2.5 py-1 rounded-md text-xs font-medium transition-all",
                            formData.studio === ''
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-muted/80"
                        )}
                    >
                        해당없음
                    </button>
                </div>
            </div>

            {/* 프로그램 제목 */}
            <div className="space-y-2">
                <Label>프로그램 제목 *</Label>
                <Input
                    value={formData.programTitle}
                    onChange={(e) => setFormData(prev => ({ ...prev, programTitle: e.target.value }))}
                    placeholder="예: 호주프로야구, V리그"
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
        // 송신 토글
        const toggleTransmission = (value: string) => {
            setFormData(prev => ({
                ...prev,
                transmissions: prev.transmissions.includes(value)
                    ? prev.transmissions.filter(t => t !== value)
                    : [...prev.transmissions, value]
            }))
        }

        // 리턴 토글
        const toggleReturn = (channel: string) => {
            setFormData(prev => ({
                ...prev,
                returns: prev.returns.includes(channel)
                    ? prev.returns.filter(r => r !== channel)
                    : [...prev.returns, channel]
            }))
        }

        return (
            <div className="space-y-6">
                {/* 수신 신호 목록 */}
                <div className="space-y-3 p-4 rounded-lg border-2 border-slate-200 bg-slate-50/50">
                    <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold">📡 수신 신호</Label>
                        <span className="text-xs text-muted-foreground">● = 메인 / ○ = 백업</span>
                    </div>

                    {/* 신호 리스트 - 장비가 선택된 신호 + 편집용 빈 슬롯 1개만 표시 */}
                    <div className="space-y-2">
                        {(() => {
                            // 장비가 선택된 신호들
                            const filledSignals = formData.signals.filter(s => s.equipment)
                            // 편집용 빈 슬롯 (첫 번째 빈 슬롯만)
                            const emptySignal = formData.signals.find(s => !s.equipment)
                            // 표시할 신호들
                            const signalsToShow = emptySignal
                                ? [...filledSignals, emptySignal]
                                : filledSignals

                            return signalsToShow.map((signal, index) => {
                                const isMain = signal.id === formData.mainSignalId
                                const sources = signal.type ? getSourcesByNetworkType(signal.type) : []
                                const equipments = signal.type && signal.source
                                    ? getEquipmentsBySource(signal.type, signal.source)
                                    : []

                                // 이미 선택된 장비 목록 (현재 신호 제외)
                                const selectedEquipments = formData.signals
                                    .filter(s => s.id !== signal.id && s.equipment)
                                    .map(s => s.equipment)

                                return (
                                    <div
                                        key={signal.id}
                                        className={cn(
                                            "flex items-center gap-2 p-2 rounded-lg border-2 transition-all",
                                            isMain
                                                ? "border-blue-300 bg-blue-50"
                                                : "border-slate-200 bg-white"
                                        )}
                                    >
                                        {/* 메인 선택 라디오 */}
                                        <button
                                            type="button"
                                            onClick={() => setMainSignal(signal.id)}
                                            className={cn(
                                                "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0",
                                                isMain
                                                    ? "border-blue-500 bg-blue-500"
                                                    : "border-slate-300 hover:border-blue-400"
                                            )}
                                        >
                                            {isMain && <div className="w-2 h-2 bg-white rounded-full" />}
                                        </button>

                                        {/* 선택된 출력 표시 또는 드롭다운들 */}
                                        {signal.equipment ? (
                                            // 이미 선택됨 - 출력만 표시
                                            <div className="flex-1 flex items-center gap-2">
                                                <span className={cn(
                                                    "px-3 py-1.5 rounded-md text-sm font-medium",
                                                    isMain ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"
                                                )}>
                                                    {signal.equipment}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    ({signal.type} &gt; {signal.source})
                                                </span>
                                            </div>
                                        ) : (
                                            // 선택 안됨 - 드롭다운들
                                            <div className="flex-1 grid grid-cols-3 gap-2">
                                                <Select
                                                    value={signal.type}
                                                    onValueChange={(value) => updateSignal(signal.id, 'type', value)}
                                                >
                                                    <SelectTrigger className="h-8 text-sm">
                                                        <SelectValue placeholder="신호" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {NETWORK_TYPES.map(type => (
                                                            <SelectItem key={type} value={type}>{type}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                <Select
                                                    value={signal.source}
                                                    onValueChange={(value) => updateSignal(signal.id, 'source', value)}
                                                    disabled={!signal.type}
                                                >
                                                    <SelectTrigger className="h-8 text-sm">
                                                        <SelectValue placeholder="소스" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {sources.map(src => (
                                                            <SelectItem key={src} value={src}>{src}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>

                                                <Select
                                                    value={signal.equipment}
                                                    onValueChange={(value) => updateSignal(signal.id, 'equipment', value)}
                                                    disabled={!signal.source}
                                                >
                                                    <SelectTrigger className="h-8 text-sm">
                                                        <SelectValue placeholder="출력" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {equipments.map(eq => (
                                                            <SelectItem
                                                                key={eq.id}
                                                                value={eq.label}
                                                                disabled={selectedEquipments.includes(eq.label)}
                                                            >
                                                                {eq.label}
                                                                {selectedEquipments.includes(eq.label) && ' (선택됨)'}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}

                                        {/* 삭제/초기화 버튼 */}
                                        <button
                                            type="button"
                                            onClick={() => signal.equipment
                                                ? updateSignal(signal.id, 'equipment', '')
                                                : removeSignal(signal.id)
                                            }
                                            disabled={!signal.equipment && formData.signals.length <= 1}
                                            className={cn(
                                                "p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0",
                                                !signal.equipment && formData.signals.length <= 1 && "opacity-30 cursor-not-allowed"
                                            )}
                                            title={signal.equipment ? "초기화" : "삭제"}
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                )
                            })
                        })()}
                    </div>

                    {/* 신호 추가 버튼 */}
                    <button
                        type="button"
                        onClick={addSignal}
                        className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2"
                    >
                        <span className="text-lg">+</span>
                        <span>신호 추가</span>
                    </button>
                </div>

                {/* 송신 / 리턴 - 복수 선택 */}
                <div className="grid grid-cols-2 gap-4">
                    {/* 송신 */}
                    <div className="space-y-2 p-3 rounded-lg border-2 border-slate-200 bg-slate-50/50">
                        <Label className="font-semibold">📤 송신</Label>
                        <div className="flex flex-wrap gap-1.5 justify-center">
                            {getTransmissionOptions().map(opt => {
                                const isSelected = formData.transmissions.includes(opt.label)
                                return (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => toggleTransmission(opt.label)}
                                        className={cn(
                                            "px-2.5 py-1 rounded-md text-xs font-medium border transition-all",
                                            isSelected
                                                ? "bg-green-100 border-green-400 text-green-700"
                                                : "bg-white border-slate-200 text-slate-600 hover:border-green-300"
                                        )}
                                    >
                                        {opt.label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* 리턴 */}
                    <div className="space-y-2 p-3 rounded-lg border-2 border-slate-200 bg-slate-50/50">
                        <Label className="font-semibold">🔄 리턴</Label>
                        <div className="flex flex-wrap gap-1 justify-center">
                            {getReturnTypes().map(returnType =>
                                getReturnChannels(returnType).map(ch => {
                                    const isSelected = formData.returns.includes(ch.label)
                                    return (
                                        <button
                                            key={ch.id}
                                            type="button"
                                            onClick={() => toggleReturn(ch.label)}
                                            className={cn(
                                                "px-2 py-0.5 rounded text-xs font-medium border transition-all",
                                                isSelected
                                                    ? "bg-purple-100 border-purple-400 text-purple-700"
                                                    : "bg-white border-slate-200 text-slate-600 hover:border-purple-300"
                                            )}
                                        >
                                            {ch.label}
                                        </button>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </div>

                {/* 수신/송신/리턴 직접 입력/수정 */}
                <div className="p-3 rounded-lg bg-slate-100 text-sm space-y-2">
                    {/* 수신 (직접 편집 가능) */}
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-red-700 w-12 shrink-0">수신:</span>
                        <input
                            type="text"
                            value={formData.receptionText}
                            onChange={(e) => setFormData(prev => ({ ...prev, receptionText: e.target.value }))}
                            placeholder="(M)FA3AO (B)TVRO-1"
                            className="flex-1 px-2 py-1 text-sm rounded border border-red-300 bg-white text-red-700 focus:outline-none focus:ring-1 focus:ring-red-400"
                        />
                    </div>
                    {/* 송신 */}
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-green-700 w-12 shrink-0">송신:</span>
                        <input
                            type="text"
                            value={formData.transmissions.join(', ')}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                transmissions: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                            }))}
                            placeholder="TX NCC-1, TX NCC-2"
                            className="flex-1 px-2 py-1 text-sm rounded border border-green-300 bg-white text-green-700 focus:outline-none focus:ring-1 focus:ring-green-400"
                        />
                    </div>
                    {/* 리턴 */}
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-purple-700 w-12 shrink-0">리턴:</span>
                        <input
                            type="text"
                            value={formData.returns.join(', ')}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                returns: e.target.value.split(',').map(s => s.trim()).filter(s => s)
                            }))}
                            placeholder="LG RET-1, IP RET-2"
                            className="flex-1 px-2 py-1 text-sm rounded border border-purple-300 bg-white text-purple-700 focus:outline-none focus:ring-1 focus:ring-purple-400"
                        />
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
                    {/* 신호 표시 */}
                    {formData.signals.filter(s => s.equipment).length > 0 && (
                        <div className="col-span-2 space-y-1">
                            {formData.signals.map((signal, idx) => {
                                if (!signal.equipment) return null
                                const isMain = signal.id === formData.mainSignalId
                                return (
                                    <div key={signal.id}>
                                        <span className="text-muted-foreground">
                                            {isMain ? '📍 메인:' : '📌 백업:'}
                                        </span>{' '}
                                        {signal.type} &gt; {signal.source} &gt; {signal.equipment}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                    {formData.transmissions.length > 0 && (
                        <div>
                            <span className="text-muted-foreground">송신:</span> {formData.transmissions.join(', ')}
                        </div>
                    )}
                    {formData.returns.length > 0 && (
                        <div>
                            <span className="text-muted-foreground">리턴:</span> {formData.returns.join(', ')}
                        </div>
                    )}
                </div>
            </div>

            {/* 추가 정보 */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>담당자</Label>
                    <Popover open={contactsOpen} onOpenChange={setContactsOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={contactsOpen}
                                className="w-full justify-between font-normal"
                            >
                                {formData.manager || "담당자 선택..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[280px] p-0">
                            <Command>
                                <CommandInput placeholder="이름 검색..." />
                                <CommandList>
                                    <CommandEmpty>검색 결과 없음</CommandEmpty>
                                    <CommandGroup>
                                        {contacts.map((contact) => (
                                            <CommandItem
                                                key={contact.id}
                                                value={contact.name}
                                                onSelect={() => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        manager: contact.name,
                                                        contactInfo: contact.phone || ""
                                                    }))
                                                    setContactsOpen(false)
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        formData.manager === contact.name ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                <div className="flex-1">
                                                    <span>{contact.name}</span>
                                                    {contact.phone && (
                                                        <span className="ml-2 text-xs text-muted-foreground">
                                                            ({contact.phone})
                                                        </span>
                                                    )}
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                    <CommandGroup>
                                        <CommandItem
                                            onSelect={() => {
                                                setNewContactForm({ name: "", phone: "", organization: "" })
                                                setNewContactDialogOpen(true)
                                                setContactsOpen(false)
                                            }}
                                            className="text-blue-600"
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            새 담당자 추가
                                        </CommandItem>
                                        <CommandItem asChild>
                                            <Link
                                                href="/settings/contacts"
                                                className="flex items-center text-muted-foreground"
                                                onClick={() => setContactsOpen(false)}
                                            >
                                                <Settings className="mr-2 h-4 w-4" />
                                                담당자 관리
                                            </Link>
                                        </CommandItem>
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="space-y-2">
                    <Label>연락처</Label>
                    <Input
                        value={formData.contactInfo}
                        onChange={(e) => setFormData(prev => ({ ...prev, contactInfo: formatPhoneNumber(e.target.value) }))}
                        placeholder="010-0000-0000"
                    />
                </div>
            </div>

            {/* New Contact Dialog */}
            <Dialog open={newContactDialogOpen} onOpenChange={setNewContactDialogOpen}>
                <DialogContent className="sm:max-w-[380px]">
                    <DialogHeader>
                        <DialogTitle>새 담당자 추가</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>이름 *</Label>
                            <Input
                                value={newContactForm.name}
                                onChange={(e) => setNewContactForm(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="담당자 이름"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>연락처</Label>
                            <Input
                                value={newContactForm.phone}
                                onChange={(e) => setNewContactForm(prev => ({ ...prev, phone: formatPhoneNumber(e.target.value) }))}
                                placeholder="010-0000-0000"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setNewContactDialogOpen(false)}>
                            취소
                        </Button>
                        <Button
                            onClick={async () => {
                                if (!newContactForm.name.trim()) {
                                    toast.error("이름을 입력해주세요.")
                                    return
                                }
                                setAddingContact(true)
                                const result = await addContact(
                                    newContactForm.name.trim(),
                                    newContactForm.phone.trim()
                                )
                                setAddingContact(false)
                                if (result) {
                                    setFormData(prev => ({
                                        ...prev,
                                        manager: result.name,
                                        contactInfo: result.phone || ""
                                    }))
                                    setNewContactDialogOpen(false)
                                    toast.success("담당자가 추가되었습니다.")
                                } else {
                                    toast.error("추가에 실패했습니다.")
                                }
                            }}
                            disabled={addingContact}
                        >
                            {addingContact ? "추가 중..." : "추가"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
            <DialogContent
                className="max-w-3xl w-[95vw] h-[700px] flex flex-col"
                style={{
                    ...(position.x !== 0 || position.y !== 0 ? {
                        transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`
                    } : {}),
                    cursor: isDragging ? 'grabbing' : 'default'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <DialogHeader className="cursor-grab active:cursor-grabbing shrink-0">
                    <DialogTitle className="text-xl">
                        {schedule ? '중계 일정 수정' : '중계 일정 등록'}
                    </DialogTitle>
                </DialogHeader>

                {/* Step Indicator */}
                <div className="shrink-0">
                    {renderStepIndicator()}
                </div>

                {/* Step Title */}
                <div className="text-center text-sm text-muted-foreground mb-4 shrink-0">
                    Step {step}. {STEP_TITLES[step]}
                </div>

                {/* Step Content - 스크롤 가능 영역 */}
                <div className="flex-1 overflow-y-auto pr-2">
                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep3()}
                    {step === 3 && renderStep4()}
                </div>

                {/* Bottom - 저장 버튼만 표시 (마지막 단계) */}
                {step === 3 && (
                    <div className="border-t pt-4 mt-4">
                        <div className="flex items-center justify-end">
                            <Button onClick={handleSubmit} disabled={loading} size="lg">
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {schedule ? '수정 완료' : '등록 완료'}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
