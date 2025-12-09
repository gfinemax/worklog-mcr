"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { TimecodeInput } from "./timecode-input"
import { NumberToggle } from "./number-toggle"

// Channel Abbreviations
const CHANNEL_ABBREVIATIONS: { [key: string]: string } = {
    "MBC SPORTS+": "SP",
    "MBC Every1": "EV",
    "MBC DRAMA": "DR",
    "MBC M": "M",
    "MBC ON": "ON",
}

export interface ChannelRowProps {
    name: string
    worklogId: string | null
    isHalf?: boolean
    hasBorderRight?: boolean
    posts: { id: string; summary: string }[]
    onPostsChange: (posts: { id: string; summary: string }[]) => void
    timecodeEntries: { [key: number]: string }
    onTimecodesChange: (entries: { [key: number]: string }) => void
    onNewPost: () => void
}

export function ChannelRow({
    name,
    worklogId,
    isHalf = false,
    hasBorderRight = false,
    posts = [],
    onPostsChange,
    timecodeEntries,
    onTimecodesChange,
    onNewPost
}: ChannelRowProps) {
    const router = useRouter()
    const [selectedType, setSelectedType] = useState<number | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [dialogValue, setDialogValue] = useState("")
    const [validationError, setValidationError] = useState("")

    // Parsed state for better UX
    const [parsedPrefix, setParsedPrefix] = useState("")
    const [parsedTimecode, setParsedTimecode] = useState("")
    const [parsedSuffix, setParsedSuffix] = useState("")
    const [isStandardFormat, setIsStandardFormat] = useState(false)

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

        // Reset to 00:00:00:00 if hours >= 24 (Max is 23:59:59:29)
        if (hours >= 24) {
            return true // Will be handled in handleDialogConfirm
        }

        if (minutes > 59) {
            setValidationError("분은 00~59 범위여야 합니다")
            return false
        }
        if (seconds > 59) {
            setValidationError("초는 00~59 범위여야 합니다")
            return false
        }
        if (frames > 29) {
            setValidationError("프레임은 00~29 범위여야 합니다")
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
        const valueToUse = existingValue || defaultText

        setDialogValue(valueToUse)

        // Parse for standard format
        const match = valueToUse.match(/^([A-Z]+)(\d{2}:\d{2}:\d{2}:\d{2})(.*)$/)
        if (match) {
            setParsedPrefix(match[1])
            setParsedTimecode(match[2])
            setParsedSuffix(match[3])
            setIsStandardFormat(true)
        } else {
            setIsStandardFormat(false)
        }

        setValidationError("")
        setIsDialogOpen(true)
    }

    const handleTimecodeChange = (newTimecode: string) => {
        setParsedTimecode(newTimecode)
        setDialogValue(`${parsedPrefix}${newTimecode}${parsedSuffix}`)
    }

    const handleDialogConfirm = () => {
        if (!validateTimecode(dialogValue)) {
            return
        }

        let finalValue = dialogValue

        // Check for rollover condition (Hours >= 24)
        const match = dialogValue.match(/(\d{2}):(\d{2}):(\d{2}):(\d{2})/)
        if (match) {
            const hours = parseInt(match[1])
            if (hours >= 24) {
                finalValue = `${parsedPrefix}00:00:00:00${parsedSuffix}`
                toast.info("최대 시간(23:59:59:29)을 초과하여 00:00:00:00으로 초기화되었습니다.")
            }
        }

        if (selectedType !== null) {
            onTimecodesChange({
                ...timecodeEntries,
                [selectedType]: finalValue
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
            onTimecodesChange(newEntries)
        }

        setIsDialogOpen(false)
        setSelectedType(null)
    }

    const handlePostClick = (postId: string) => {
        router.push(`/posts/${postId}`)
    }

    const handleNewPostClick = () => {
        onNewPost()
    }

    return (
        <div className={cn("flex flex-col h-full", hasBorderRight && "border-r border-black")}>
            <div className="flex items-center justify-between border-b border-black p-1 text-sm bg-gray-50/50">
                <div className="flex items-center gap-2">
                    <span className="font-bold whitespace-nowrap">{name}</span>
                </div>
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
                <div className="w-3/4 border-r border-gray-300 p-1 overflow-y-auto">
                    {posts && posts.length > 0 ? (
                        <ul className="list-none space-y-1">
                            {posts.map(post => (
                                <li key={post.id}
                                    onDoubleClick={() => handlePostClick(post.id)}
                                    className="cursor-pointer hover:bg-gray-100 rounded text-sm group flex items-start"
                                >
                                    <span className="mr-1">•</span>
                                    <span className="group-hover:underline">{post.summary}</span>
                                </li>
                            ))}
                            {posts.length < 5 && (
                                <li onClick={handleNewPostClick} className="cursor-pointer text-gray-400 hover:text-gray-600 text-sm mt-1 print:hidden">
                                    + 추가
                                </li>
                            )}
                        </ul>
                    ) : (
                        <div
                            onClick={handleNewPostClick}
                            className="h-full w-full text-sm text-gray-400 cursor-pointer hover:bg-gray-50 flex items-start pt-1"
                        >
                            특이사항 없음
                        </div>
                    )}
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
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>운행표 수정 내용 입력</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {isStandardFormat ? (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-center gap-2 text-lg font-medium">
                                    <span className="text-muted-foreground">{parsedPrefix}</span>
                                    <TimecodeInput
                                        value={parsedTimecode}
                                        onChange={handleTimecodeChange}
                                        onComplete={() => { }} // Optional: auto-submit?
                                    />
                                    <span className="text-muted-foreground">{parsedSuffix}</span>
                                </div>
                                <div className="text-center text-xs text-muted-foreground">
                                    * 타임코드(HH:MM:SS:FF)만 입력하면 전체 내용이 자동 완성됩니다.
                                </div>
                            </div>
                        ) : (
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
                        )}
                        {validationError && (
                            <div className="text-center text-sm text-red-600">
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
