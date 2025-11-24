"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Printer, Save } from "lucide-react"
import { cn } from "@/lib/utils"
import { MainLayout } from "@/components/layout/main-layout"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { useWorklogStore } from "@/store/worklog"

// Channel Abbreviations
const CHANNEL_ABBREVIATIONS: { [key: string]: string } = {
    "MBC SPORTS+": "SP",
    "MBC Every1": "EV",
    "MBC DRAMA": "DR",
    "MBC M": "M",
    "MBC ON": "ON",
}

// Component for the circular number toggle
function NumberToggle({ value, selected, onClick }: { value: number; selected: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex h-4 w-4 items-center justify-center rounded-full border border-black text-[10px] transition-colors",
                selected ? "bg-black text-white font-bold" : "bg-white text-black hover:bg-gray-100"
            )}
        >
            {value}
        </button>
    )
}

// Component for the channel row
function ChannelRow({
    name,
    isHalf = false,
    hasBorderRight = false,
}: {
    name: string
    isHalf?: boolean
    hasBorderRight?: boolean
}) {
    const [selectedType, setSelectedType] = useState<number | null>(null)
    const [content, setContent] = useState<string>("")
    const [timecodeEntries, setTimecodeEntries] = useState<{ [key: number]: string }>({})
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [dialogValue, setDialogValue] = useState("")
    const [validationError, setValidationError] = useState("")

    const validateTimecode = (text: string): boolean => {
        const timecodePattern = /(\d{2}):(\d{2}):(\d{2}):(\d{2})/
        const match = text.match(timecodePattern)

        if (!match) {
            setValidationError("타임코드 형식이 올바르지 않습니다 (HH:MM:SS:FF)")
            return false
        }

        const [_, hh, mm, ss, ff] = match
        const hours = parseInt(hh)
        const minutes = parseInt(mm)
        const seconds = parseInt(ss)
        const frames = parseInt(ff)

        if (hours > 23) {
            setValidationError("시간은 00~23 범위여야 합니다")
            return false
        }
        if (minutes > 59) {
            setValidationError("분은 00~59 범위여야 합니다")
            return false
        }
        if (seconds > 59) {
            setValidationError("초는 00~59 범위여야 합니다")
            return false
        }
        if (frames > 23) {
            setValidationError("프레임은 00~23 범위여야 합니다")
            return false
        }

        setValidationError("")
        return true
    }

    const generateRightContent = (): string => {
        const sortedEntries = Object.entries(timecodeEntries)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([_, value]) => value)

        return sortedEntries.join('\n')
    }

    const handleNumberClick = (num: number) => {
        setSelectedType(num)
        const abbr = CHANNEL_ABBREVIATIONS[name] || ""
        const existingValue = timecodeEntries[num]
        const defaultText = `${abbr}00:00:00:00부터 정규${num + 1}번`

        setDialogValue(existingValue || defaultText)
        setValidationError("")
        setIsDialogOpen(true)
    }

    const handleDialogConfirm = () => {
        if (!validateTimecode(dialogValue)) {
            return
        }

        if (selectedType !== null) {
            setTimecodeEntries({
                ...timecodeEntries,
                [selectedType]: dialogValue
            })
        }

        setIsDialogOpen(false)
        setSelectedType(null)
    }

    const handleDialogClose = (open: boolean) => {
        if (!open) {
            setSelectedType(null)
            setValidationError("")
        }
        setIsDialogOpen(open)
    }

    const handleDelete = () => {
        if (selectedType !== null) {
            const newEntries = { ...timecodeEntries }
            delete newEntries[selectedType]
            setTimecodeEntries(newEntries)
        }

        setIsDialogOpen(false)
        setSelectedType(null)
    }

    return (
        <div className={cn("flex flex-col h-full", hasBorderRight && "border-r border-black")}>
            <div className="flex items-center justify-between border-b border-black p-1 text-sm bg-gray-50/50">
                <span className="font-bold whitespace-nowrap">{name}</span>
                <div className="flex items-center gap-1">
                    <span className="whitespace-nowrap text-sm">운행표 수정</span>
                    <div className="inline-flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((num) => (
                            <NumberToggle
                                key={num}
                                value={num}
                                selected={timecodeEntries[num] !== undefined}
                                onClick={() => handleNumberClick(num)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex flex-1 min-h-[6rem]">
                <div className="w-3/4 border-r border-gray-300">
                    <textarea
                        className="h-full w-full resize-none p-1 text-sm outline-none bg-transparent leading-tight"
                        placeholder="특히사항 없음"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                    ></textarea>
                </div>
                <div className="w-1/4">
                    <textarea
                        className="h-full w-full resize-none p-1 text-sm outline-none bg-transparent leading-tight overflow-hidden whitespace-nowrap"
                        placeholder=""
                        value={generateRightContent()}
                        readOnly
                    ></textarea>
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>운행표 수정 내용 입력</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="timecode" className="text-right">
                                내용
                            </Label>
                            <Input
                                id="timecode"
                                value={dialogValue}
                                onChange={(e) => setDialogValue(e.target.value)}
                                className="col-span-3"
                            />
                        </div>
                        {validationError && (
                            <div className="col-span-4 text-sm text-red-600">
                                {validationError}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        {selectedType !== null && timecodeEntries[selectedType] && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleDelete}
                            >
                                삭제
                            </Button>
                        )}
                        <Button type="submit" onClick={handleDialogConfirm}>적용</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default function TodayWorkLog() {
    const router = useRouter()
    const addWorklog = useWorklogStore((state) => state.addWorklog)
    const [date, setDate] = useState<string>("")
    const [shiftType, setShiftType] = useState<'day' | 'night'>('night')
    const [selectedTeam, setSelectedTeam] = useState<string>("1조")
    const [workers, setWorkers] = useState<{
        director: string[];
        assistant: string[];
        video: string[];
    }>({
        director: ['김철수'],
        assistant: ['이영희'],
        video: ['박민수']
    })

    const updateTitle = () => {
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth() + 1
        const day = now.getDate()

        const yy = year.toString().slice(2)
        const mm = month.toString().padStart(2, '0')
        const dd = day.toString().padStart(2, '0')
        const shiftStr = shiftType === 'day' ? 'A' : 'N'
        document.title = `MCR 업무일지_${yy}${mm}${dd}_${shiftStr}`
    }

    useEffect(() => {
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth() + 1
        const day = now.getDate()
        const weekDays = ["일", "월", "화", "수", "목", "금", "토"]
        const weekDay = weekDays[now.getDay()]
        setDate(`${year}년 ${month}월 ${day}일 ${weekDay}요일`)

        // Update title on mount and shift change
        updateTitle()
    }, [shiftType])

    const handleSave = () => {
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth() + 1
        const day = now.getDate()
        const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`

        addWorklog({
            id: Date.now(),
            date: dateStr,
            team: selectedTeam,
            type: shiftType === 'day' ? '주간' : '야간',
            workers: workers,
            status: "작성중",
            signature: "1/4",
            isImportant: false,
        })
        router.push('/worklog')
    }

    const handlePrint = () => {
        updateTitle() // Ensure title is correct before printing
        setTimeout(() => {
            window.print()
        }, 100)
    }

    return (
        <MainLayout>
            <div className="min-h-screen bg-gray-100 p-8 print:bg-white print:p-0 font-sans">
                <div className="mx-auto max-w-[210mm] print:max-w-none">
                    {/* Action Buttons - Hidden in print */}
                    <div className="mb-6 flex justify-between items-center print:hidden">
                        <div className="flex items-center gap-4">
                            <h1 className="text-2xl font-bold">TODAY 업무일지</h1>
                            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                                <SelectTrigger className="w-[120px]">
                                    <SelectValue placeholder="근무조 선택" />
                                </SelectTrigger>
                                <SelectContent>
                                    {[...Array(10)].map((_, i) => (
                                        <SelectItem key={i + 1} value={`${i + 1}조`}>
                                            {i + 1}조
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={handleSave}>
                                <Save className="mr-2 h-4 w-4" />
                                임시저장
                            </Button>
                            <Button onClick={handlePrint}>
                                <Printer className="mr-2 h-4 w-4" />
                                인쇄하기
                            </Button>
                        </div>
                    </div>

                    {/* A4 Page Container */}
                    <div className="bg-white p-[10mm] shadow-lg print:shadow-none print:m-0 w-[210mm] min-h-[297mm] mx-auto relative box-border flex flex-col">

                        {/* Header Section */}
                        <div className="mb-1">
                            <div className="flex items-start justify-between">
                                {/* Logo & Team Name */}
                                <div className="flex flex-col justify-between h-32">
                                    <div>
                                        <div className="text-xs font-bold text-red-600 italic">Let&apos;s plus!</div>
                                        <div className="text-2xl font-black tracking-tight text-slate-800">MBC PLUS</div>
                                    </div>
                                    <div className="text-base font-bold">방송인프라팀</div>
                                </div>

                                {/* Title & Date */}
                                <div className="flex flex-col items-center justify-between h-32">
                                    <div className="mt-2 text-3xl font-bold tracking-[0.03em] text-black text-center">주 조 정 실 &nbsp; 업 무 일 지</div>
                                    <div className="text-base font-bold">{date}</div>
                                </div>

                                {/* Approval Box */}
                                <div className="flex border border-black text-center text-xs">
                                    <div className="flex flex-col w-[70px] border-r border-black">
                                        <div className="bg-gray-100 py-0.5 font-bold border-b border-black">운 행</div>
                                        <div className="h-10 flex items-center justify-center cursor-pointer hover:bg-gray-50"></div>
                                        <div className="bg-gray-100 py-0.5 font-bold border-t border-b border-black">MCR</div>
                                        <div className="h-10 flex items-center justify-center cursor-pointer hover:bg-gray-50"></div>
                                    </div>
                                    <div className="flex flex-col w-[70px]">
                                        <div className="bg-gray-100 py-0.5 font-bold border-b border-black">팀 장</div>
                                        <div className="h-10 flex items-center justify-center cursor-pointer hover:bg-gray-50"></div>
                                        <div className="bg-gray-100 py-0.5 font-bold border-t border-b border-black">Network</div>
                                        <div className="h-10 flex items-center justify-center cursor-pointer hover:bg-gray-50"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Shift Table */}
                        <div className="mb-2 w-full border border-black">
                            <div className="flex bg-gray-100 text-center text-sm font-bold border-b border-black">
                                <div
                                    className="w-[180px] border-r border-black py-1 cursor-pointer hover:bg-gray-200"
                                    onClick={() => setShiftType(prev => prev === 'day' ? 'night' : 'day')}
                                >
                                    {shiftType === 'day' ? '주간근무시간' : '야간근무시간'}
                                </div>
                                <div className="flex-1 border-r border-black py-1">감 독</div>
                                <div className="flex-1 border-r border-black py-1">부 감 독</div>
                                <div className="flex-1 py-1">영 상</div>
                            </div>
                            <div className="flex text-center text-sm min-h-[2rem]">
                                <div className="w-[180px] border-r border-black flex items-center justify-center font-bold">
                                    {shiftType === 'day' ? '07:30 ~ 19:00' : '18:30 ~ 08:00'}
                                </div>
                                {/* Director */}
                                <div className="flex-1 border-r border-black p-1 flex flex-col justify-center gap-1 relative group">
                                    {workers.director.map((name, index) => (
                                        <Input
                                            key={index}
                                            className="h-6 text-center border-none shadow-none focus-visible:ring-0 p-0 font-handwriting text-base"
                                            value={name}
                                            onChange={(e) => {
                                                const newWorkers = [...workers.director];
                                                newWorkers[index] = e.target.value;
                                                setWorkers({ ...workers, director: newWorkers });
                                            }}
                                            placeholder="이름"
                                        />
                                    ))}
                                    {workers.director.length < 4 && (
                                        <div
                                            className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-pointer text-gray-400 hover:text-black"
                                            onClick={() => setWorkers({ ...workers, director: [...workers.director, ''] })}
                                        >
                                            +
                                        </div>
                                    )}
                                </div>
                                {/* Assistant Director */}
                                <div className="flex-1 border-r border-black p-1 flex flex-col justify-center gap-1 relative group">
                                    {workers.assistant.map((name, index) => (
                                        <Input
                                            key={index}
                                            className="h-6 text-center border-none shadow-none focus-visible:ring-0 p-0 font-handwriting text-base"
                                            value={name}
                                            onChange={(e) => {
                                                const newWorkers = [...workers.assistant];
                                                newWorkers[index] = e.target.value;
                                                setWorkers({ ...workers, assistant: newWorkers });
                                            }}
                                            placeholder="이름"
                                        />
                                    ))}
                                    {workers.assistant.length < 4 && (
                                        <div
                                            className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-pointer text-gray-400 hover:text-black"
                                            onClick={() => setWorkers({ ...workers, assistant: [...workers.assistant, ''] })}
                                        >
                                            +
                                        </div>
                                    )}
                                </div>
                                {/* Video */}
                                <div className="flex-1 p-1 flex flex-col justify-center gap-1 relative group">
                                    {workers.video.map((name, index) => (
                                        <Input
                                            key={index}
                                            className="h-6 text-center border-none shadow-none focus-visible:ring-0 p-0 font-handwriting text-base"
                                            value={name}
                                            onChange={(e) => {
                                                const newWorkers = [...workers.video];
                                                newWorkers[index] = e.target.value;
                                                setWorkers({ ...workers, video: newWorkers });
                                            }}
                                            placeholder="이름"
                                        />
                                    ))}
                                    {workers.video.length < 4 && (
                                        <div
                                            className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-pointer text-gray-400 hover:text-black"
                                            onClick={() => setWorkers({ ...workers, video: [...workers.video, ''] })}
                                        >
                                            +
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Channel Logs Section Title */}
                        <div className="mb-0 border border-black bg-gray-300 py-0.5 text-center font-bold border-b-0 text-base tracking-[0.3em]">
                            채널별 송출사항
                        </div>

                        {/* Channels Container */}
                        <div className="border border-black border-b-0 flex-1 flex flex-col">

                            {/* MBC SPORTS+ */}
                            <div className="border-b border-black flex-1">
                                <ChannelRow name="MBC SPORTS+" />
                            </div>

                            {/* MBC Every1 */}
                            <div className="border-b border-black flex-1">
                                <ChannelRow name="MBC Every1" />
                            </div>

                            {/* MBC DRAMA */}
                            <div className="border-b border-black flex-1">
                                <ChannelRow name="MBC DRAMA" />
                            </div>

                            {/* MBC M */}
                            <div className="border-b border-black flex-1">
                                <ChannelRow name="MBC M" />
                            </div>

                            {/* MBC ON */}
                            <div className="border-b border-black flex-1">
                                <ChannelRow name="MBC ON" />
                            </div>

                        </div>

                        {/* System Issues */}
                        <div className="border border-black border-t-0 shrink-0">
                            <div className="bg-gray-100 py-0.5 text-center text-sm font-bold border-b border-black">장비 및 시스템 주요사항</div>
                            <div className="h-32">
                                <textarea
                                    className="h-full w-full resize-none p-1 text-sm outline-none bg-transparent leading-tight"
                                    placeholder="특이사항 없음"
                                ></textarea>
                            </div>
                        </div>

                        {/* Footer Check */}
                        <div className="mt-2 flex justify-end items-center gap-2 shrink-0">
                            <span className="font-bold text-xs">Private CDN A/V 이상없습니다.</span>
                            <div className="h-5 w-5 border border-black flex items-center justify-center cursor-pointer hover:bg-gray-100">
                                <span className="text-sm">v</span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </MainLayout>
    )
}
