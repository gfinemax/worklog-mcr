"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Printer, Save, RefreshCw, PenTool } from "lucide-react"
import { cn } from "@/lib/utils"
import { MainLayout } from "@/components/layout/main-layout"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { PinVerificationDialog } from "@/components/auth/pin-verification-dialog"
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
import { toast } from "sonner"
import { useWorklogStore, Worklog, ChannelLog } from "@/store/worklog"
import { useAuthStore } from "@/store/auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
// Timecode Input Component
function TimecodeInput({ value, onChange, onComplete }: { value: string; onChange: (val: string) => void; onComplete?: () => void }) {
    const inputs = useRef<(HTMLInputElement | null)[]>([])

    const handleChange = (index: number, val: string) => {
        if (!/^\d*$/.test(val)) return

        const parts = value.split(':')
        // Ensure we have 4 parts
        while (parts.length < 4) parts.push('00')

        parts[index] = val

        // Auto-advance if 2 digits
        if (val.length === 2 && index < 3) {
            inputs.current[index + 1]?.focus()
        }

        onChange(parts.join(':'))

        if (index === 3 && val.length === 2 && onComplete) {
            onComplete()
        }
    }

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !e.currentTarget.value && index > 0) {
            inputs.current[index - 1]?.focus()
        }
    }

    const parts = value.split(':')
    while (parts.length < 4) parts.push('00')

    return (
        <div className="flex items-center gap-1">
            {parts.map((part, index) => (
                <div key={index} className="flex items-center">
                    <Input
                        ref={el => { inputs.current[index] = el }}
                        className="w-12 text-center p-1 h-9 font-mono text-lg"
                        value={part}
                        onChange={(e) => handleChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onFocus={(e) => e.target.select()}
                        onBlur={() => {
                            if (part.length === 1) {
                                handleChange(index, part.padStart(2, '0'))
                            }
                        }}
                        maxLength={2}
                        placeholder="00"
                    />
                    {index < 3 && <span className="mx-1 font-bold">:</span>}
                </div>
            ))}
        </div>
    )
}

function ChannelRow({
    name,
    worklogId,
    isHalf = false,
    hasBorderRight = false,
    posts = [],
    onPostsChange,
    timecodeEntries,
    onTimecodesChange,
    onNewPost
}: {
    name: string
    worklogId: string | null
    isHalf?: boolean
    hasBorderRight?: boolean
    posts: { id: string; summary: string }[]
    onPostsChange: (posts: { id: string; summary: string }[]) => void
    timecodeEntries: { [key: number]: string }
    onTimecodesChange: (entries: { [key: number]: string }) => void
    onNewPost: () => void
}) {
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

        if (selectedType !== null) {
            onTimecodesChange({
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
                                    onClick={() => handlePostClick(post.id)}
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

export default function TodayWorkLog() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const id = searchParams.get('id')
    const paramTeam = searchParams.get('team')
    const paramType = searchParams.get('type')

    const { worklogs, addWorklog, updateWorklog, fetchWorklogById, fetchWorklogs, fetchWorklogPosts } = useWorklogStore()
    const { currentSession, nextSession, promoteNextSession, logout } = useAuthStore()

    const [date, setDate] = useState<string>("")
    const [shiftType, setShiftType] = useState<'day' | 'night'>('night')
    const [selectedTeam, setSelectedTeam] = useState<string>("")
    const [workers, setWorkers] = useState<{
        director: string[];
        assistant: string[];
        video: string[];
    }>({
        director: [],
        assistant: [],
        video: []
    })
    const [status, setStatus] = useState<Worklog['status']>('작성중')
    const [channelLogs, setChannelLogs] = useState<{ [key: string]: ChannelLog }>({})
    const [systemIssues, setSystemIssues] = useState<{ id: string; summary: string }[]>([])

    // PIN Verification State
    const [pinDialogOpen, setPinDialogOpen] = useState(false)
    const [pendingAction, setPendingAction] = useState<'handover' | 'sign' | null>(null)

    // Post Creation Confirmation State
    const [pendingPost, setPendingPost] = useState<{
        sourceField: string;
        categorySlug: string;
        tag: string;
        channel?: string;
    } | null>(null)

    // Determine Active Tab
    const [activeTab, setActiveTab] = useState<string>("current")

    useEffect(() => {
        if (nextSession) {
            // If we are viewing the next session's team, active tab is 'next'
            if (selectedTeam === nextSession.groupName) {
                setActiveTab("next")
            } else {
                setActiveTab("current")
            }
        }
    }, [selectedTeam, nextSession])

    // Auto-save effect
    useEffect(() => {
        if (!id) return

        const timer = setTimeout(() => {
            // @ts-ignore
            updateWorklog(id, {
                groupName: selectedTeam,
                type: shiftType === 'day' ? '주간' : '야간',
                workers: workers,
                channelLogs: channelLogs,
                systemIssues: systemIssues
            })
        }, 3000) // 3 seconds debounce

        return () => clearTimeout(timer)
    }, [id, selectedTeam, shiftType, workers, channelLogs, systemIssues, updateWorklog])

    // Initial fetch logic
    useEffect(() => {
        if (id) {
            fetchWorklogById(id)
        } else {
            fetchWorklogs()
        }
    }, [id, fetchWorklogById, fetchWorklogs])

    // Fetch current user's team on mount (if no ID and no params)
    useEffect(() => {
        if (id || paramTeam) return

        if (currentSession) {
            setSelectedTeam(currentSession.groupName)
            return
        }

        const fetchUserTeam = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get user's group
            const { data: memberData } = await supabase
                .from('group_members')
                .select('groups(name)')
                .eq('user_id', user.id)
                .single()

            if (memberData && memberData.groups) {
                // @ts-ignore
                setSelectedTeam(memberData.groups.name)
            }
        }

        fetchUserTeam()
    }, [id, paramTeam, currentSession])

    // Handle Query Params Override
    useEffect(() => {
        if (paramTeam) setSelectedTeam(paramTeam)
        if (paramType) setShiftType(paramType as 'day' | 'night')
    }, [paramTeam, paramType])


    // Sync state from store
    useEffect(() => {
        if (id) {
            const worklog = worklogs.find(w => String(w.id) === id)
            if (worklog) {
                // Parse date string (YYYY-MM-DD) to Date object
                const [yearStr, monthStr, dayStr] = worklog.date.split('-')
                const dateObj = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr))

                const weekDays = ["일", "월", "화", "수", "목", "금", "토"]
                const weekDay = weekDays[dateObj.getDay()]

                setDate(`${yearStr}년 ${Number(monthStr)}월 ${Number(dayStr)}일 ${weekDay}요일`)
                setShiftType(worklog.type === '주간' ? 'day' : 'night')
                setSelectedTeam(worklog.groupName)
                setWorkers(worklog.workers)
                setStatus(worklog.status)

                // Fetch latest posts to ensure sync
                fetchWorklogPosts(id).then(posts => {
                    const newChannelLogs = { ...(worklog.channelLogs || {}) }
                    const newSystemIssues: { id: string; summary: string }[] = []

                    // Reset posts in channel logs but keep timecodes
                    Object.keys(newChannelLogs).forEach(key => {
                        newChannelLogs[key] = {
                            ...newChannelLogs[key],
                            posts: []
                        }
                    })

                    posts.forEach(post => {
                        if (post.channel) {
                            if (!newChannelLogs[post.channel]) {
                                newChannelLogs[post.channel] = { posts: [], timecodes: {} }
                            }
                            newChannelLogs[post.channel].posts.push({
                                id: post.id,
                                summary: post.summary
                            })
                        } else {
                            newSystemIssues.push({
                                id: post.id,
                                summary: post.summary
                            })
                        }
                    })

                    if (JSON.stringify(newChannelLogs) !== JSON.stringify(channelLogs)) {
                        setChannelLogs(newChannelLogs)
                    } else {
                        setChannelLogs(worklog.channelLogs || {})
                    }

                    if (JSON.stringify(newSystemIssues) !== JSON.stringify(systemIssues)) {
                        setSystemIssues(newSystemIssues)
                    } else {
                        setSystemIssues(worklog.systemIssues || [])
                    }
                })

                if (worklog.status === '서명완료') {
                    toast.warning("이미 서명이 완료된 일지입니다. 수정 시 주의해주세요.", {
                        duration: 5000,
                    })
                } else if (worklog.status === '근무종료') {
                    toast.info("근무 시간이 종료되었습니다. 서명을 완료해주세요.", {
                        duration: 5000,
                    })
                }
            }
        } else {
            const now = new Date()
            const year = now.getFullYear()
            const month = now.getMonth() + 1
            const day = now.getDate()
            const weekDays = ["일", "월", "화", "수", "목", "금", "토"]
            const weekDay = weekDays[now.getDay()]
            setDate(`${year}년 ${month}월 ${day}일 ${weekDay}요일`)

            // Determine shift based on current time (Day: 07:30 ~ 07:30 next day)
            // If paramType is present, use it. Otherwise calculate.
            if (!paramType) {
                const currentHour = now.getHours()
                const currentMinute = now.getMinutes()
                const currentTime = currentHour * 60 + currentMinute

                const dayStart = 7 * 60 + 30 // 07:30
                const dayEnd = 18 * 60 + 30 // 18:30

                const isDayShift = currentTime >= dayStart && currentTime < dayEnd
                const currentShiftType = isDayShift ? 'day' : 'night'
                setShiftType(currentShiftType)
            }

            // Check if a worklog already exists for today, this team, and this shift
            // We need to format date as YYYY-MM-DD to match DB
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

            const existingWorklog = worklogs.find(w =>
                w.date === dateStr &&
                w.groupName === selectedTeam &&
                (w.type === '주간' ? 'day' : 'night') === shiftType
            )

            if (existingWorklog) {
                console.log('Found existing worklog for today, redirecting:', existingWorklog)
                router.replace(`/worklog/today?id=${existingWorklog.id}`)
                return // Stop execution here, let the redirect happen
            }

            // If no existing worklog, we might need to populate workers from session members if available
            // This is handled by the useEffect below, but we can optimize for Next Session
            if (activeTab === 'next' && nextSession && selectedTeam === nextSession.groupName) {
                const newWorkers = {
                    director: [] as string[],
                    assistant: [] as string[],
                    video: [] as string[]
                }
                nextSession.members.forEach(m => {
                    if (m.role === '감독') newWorkers.director.push(m.name)
                    else if (m.role === '부감독') newWorkers.assistant.push(m.name)
                    else newWorkers.video.push(m.name)
                })
                setWorkers(newWorkers)
            }
        }
    }, [id, worklogs, selectedTeam, shiftType, paramType, activeTab, nextSession])

    // Fetch group members when team changes (only if no ID or creating new)
    useEffect(() => {
        // If we are in Next Session tab, we already set workers from session members in the previous effect
        if (activeTab === 'next' && nextSession && selectedTeam === nextSession.groupName) return

        // [Modified] Use currentSession members if available and matches selectedTeam
        // We do this EVEN IF id exists, to ensure the displayed workers match the logged-in session (user request)
        if (currentSession && selectedTeam === currentSession.groupName) {
            const newWorkers = {
                director: [] as string[],
                assistant: [] as string[],
                video: [] as string[]
            }
            currentSession.members.forEach(m => {
                // Map roles to worker categories
                // Note: currentSession roles might be '감독', '부감독', '영상' etc.
                if (m.role === '감독') newWorkers.director.push(m.name)
                else if (m.role === '부감독') newWorkers.assistant.push(m.name)
                else newWorkers.video.push(m.name)
            })
            setWorkers(newWorkers)
            return
        }

        if (id) return // If editing existing log, don't overwrite workers with default group members from DB

        const fetchGroupMembers = async () => {
            if (!selectedTeam) return

            // 1. Get Group ID
            const { data: groupData } = await supabase
                .from('groups')
                .select('id')
                .eq('name', selectedTeam)
                .single()

            if (!groupData) {
                setWorkers({ director: [], assistant: [], video: [] })
                return
            }

            // 2. Get Members (Fetch separately to avoid join issues)
            const { data: members, error: membersError } = await supabase
                .from('group_members')
                .select('user_id, role')
                .eq('group_id', groupData.id)

            if (membersError || !members) {
                console.error('Error fetching group members:', membersError)
                return
            }

            // 3. Get User Details
            const userIds = members.map(m => m.user_id)
            const { data: users, error: usersError } = await supabase
                .from('users')
                .select('id, name, role')
                .in('id', userIds)

            if (usersError || !users) {
                console.error('Error fetching users for group:', usersError)
                return
            }

            const newWorkers = {
                director: [] as string[],
                assistant: [] as string[],
                video: [] as string[]
            }

            members.forEach((m: any) => {
                const user = users.find(u => u.id === m.user_id)
                if (!user) return
                const roleStr = (m.role || user.role || '').toLowerCase()

                if (roleStr.includes('감독') && !roleStr.includes('부감독')) {
                    newWorkers.director.push(user.name)
                } else if (roleStr.includes('부감독')) {
                    newWorkers.assistant.push(user.name)
                } else if (roleStr.includes('영상') || roleStr.includes('기술')) {
                    newWorkers.video.push(user.name)
                }
            })

            setWorkers(newWorkers)
        }

        fetchGroupMembers()
    }, [selectedTeam, id, activeTab, nextSession, currentSession])

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
        updateTitle()
    }, [shiftType])

    const getPageTitle = () => {
        if (status === '근무종료' || status === '서명완료') return '업무일지'
        return 'TODAY 업무일지'
    }

    const handleSave = async (silent = false) => {
        if (id) {
            // @ts-ignore - ID type mismatch (number vs string)
            const { error } = await updateWorklog(id, {
                groupName: selectedTeam,
                type: shiftType === 'day' ? '주간' : '야간',
                workers: workers,
                channelLogs: channelLogs,
                systemIssues: systemIssues
            })

            if (error) {
                if (!silent) toast.error("저장에 실패했습니다.")
                return null
            }

            if (!silent) toast.success("저장되었습니다.")
            return id
        } else {
            const now = new Date()
            const year = now.getFullYear()
            const month = now.getMonth() + 1
            const day = now.getDate()
            const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`

            const newLog = await addWorklog({
                date: dateStr,
                groupName: selectedTeam,
                type: shiftType === 'day' ? '주간' : '야간',
                workers: workers,
                status: "작성중",
                signature: "1/4",
                isImportant: false,
                channelLogs: channelLogs,
                systemIssues: systemIssues
            })

            if (!newLog || 'error' in newLog) {
                if (!silent) toast.error("일지 생성에 실패했습니다.")
                return null
            }

            if (newLog) {
                if (!silent) {
                    toast.success("새 일지가 생성되었습니다.")
                    const newUrl = `/worklog/today?id=${newLog.id}`
                    window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl)
                    router.replace(newUrl)
                } else {
                    // Just update history for back button support, don't trigger navigation
                    const newUrl = `/worklog/today?id=${newLog.id}`
                    window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl)
                }
                return newLog.id
            }
            return null
        }
    }

    const handleNewPostRequest = async (sourceField: string, categorySlug: string, tag: string, channel?: string) => {
        let currentId = id
        if (!currentId) {
            // Auto-save first
            const savedId = await handleSave(true)
            if (!savedId) {
                toast.error("일지 저장에 실패했습니다.")
                return
            }
            currentId = String(savedId)
        }

        const params = new URLSearchParams({
            worklogId: currentId!,
            categorySlug: categorySlug,
            tag: tag,
            sourceField: sourceField
        })
        if (channel) {
            params.append('channel', channel)
        }

        router.push(`/posts/new?${params.toString()}`)
    }

    const handlePrint = () => {
        updateTitle()
        setTimeout(() => {
            window.print()
        }, 100)
    }

    const handleTimecodesChange = async (channelName: string, timecodes: any) => {
        console.log(`Saving timecodes for ${channelName}:`, timecodes)
        const newChannelLogs = {
            ...channelLogs,
            [channelName]: {
                ...channelLogs[channelName],
                posts: channelLogs[channelName]?.posts || [],
                timecodes: timecodes
            }
        }
        setChannelLogs(newChannelLogs)

        if (id) {
            try {
                // @ts-ignore
                await updateWorklog(id, {
                    groupName: selectedTeam,
                    type: shiftType === 'day' ? '주간' : '야간',
                    workers: workers,
                    channelLogs: newChannelLogs,
                    systemIssues: systemIssues
                })
                toast.success("운행표 수정사항이 저장되었습니다.")
            } catch (error) {
                console.error("Failed to save timecodes", error)
                toast.error("저장에 실패했습니다.")
            }
        }
    }

    const handleTabChange = (val: string) => {
        if (val === 'current') {
            // Revert to current session logic
            // We can just push to /worklog/today and let it auto-detect based on current user
            router.push('/worklog/today')
        } else if (val === 'next' && nextSession) {
            // Switch to next session
            // Calculate next shift type
            const nextShift = shiftType === 'day' ? 'night' : 'day'
            router.push(`/worklog/today?team=${nextSession.groupName}&type=${nextShift}`)
        }
    }

    const handlePromoteSession = () => {
        setPendingAction('handover')
        setPinDialogOpen(true)
    }

    const handleSign = () => {
        setPendingAction('sign')
        setPinDialogOpen(true)
    }

    const handlePinSuccess = async (user: any) => {
        if (pendingAction === 'handover') {
            promoteNextSession()
            router.push('/')
            toast.success(`${user.name}님의 승인으로 근무 교대가 완료되었습니다.`)
        } else if (pendingAction === 'sign') {
            if (id) {
                // @ts-ignore
                await updateWorklog(id, { status: '서명완료' })
                setStatus('서명완료')
                toast.success(`${user.name}님의 서명이 완료되었습니다.`)
            }
        }
        setPendingAction(null)
    }

    return (
        <MainLayout>
            <div className={cn("min-h-screen p-8 print:bg-white print:p-0 font-sans", activeTab === 'next' ? "bg-amber-50/50" : "bg-gray-100")}>
                <div className="mx-auto max-w-[210mm] print:max-w-none">

                    {/* Tabs for Handover Mode */}
                    {nextSession && (
                        <div className="mb-6 print:hidden">
                            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 h-12">
                                    <TabsTrigger value="current" className="text-base">
                                        [현재] {currentSession?.groupName || "현재 근무"}
                                    </TabsTrigger>
                                    <TabsTrigger value="next" className="text-base data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900">
                                        [다음] {nextSession.groupName} (준비 중)
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    )}

                    {/* Action Buttons - Hidden in print */}
                    <div className="mb-6 flex justify-between items-center print:hidden">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                                {status === '근무종료' && (
                                    <Badge className="bg-amber-500 hover:bg-amber-600 text-base px-3 py-1">근무종료</Badge>
                                )}
                                {status === '서명완료' && (
                                    <Badge className="bg-teal-600 hover:bg-teal-700 text-base px-3 py-1">서명완료</Badge>
                                )}
                                <h1 className="text-2xl font-bold">{getPageTitle()}</h1>
                            </div>
                            <Button variant="outline" onClick={() => router.push('/worklog')}>
                                목록으로
                            </Button>

                        </div>
                        <div className="flex gap-2">
                            {/* Promote Session Button (Only visible in Current tab if next session exists) */}
                            {activeTab === 'current' && nextSession && (
                                <Button onClick={handlePromoteSession} className="bg-indigo-600 hover:bg-indigo-700">
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    근무 교대 (세션 넘기기)
                                </Button>
                            )}

                            {status !== '서명완료' && (
                                <Button variant="outline" onClick={handleSign} className="border-teal-600 text-teal-700 hover:bg-teal-50">
                                    <PenTool className="mr-2 h-4 w-4" />
                                    결재(서명)
                                </Button>
                            )}

                            <Button variant="outline" onClick={() => handleSave()}>
                                <Save className="mr-2 h-4 w-4" />
                                저장
                            </Button>
                            <Button onClick={handlePrint}>
                                <Printer className="mr-2 h-4 w-4" />
                                인쇄하기
                            </Button>
                        </div>
                    </div>

                    <PinVerificationDialog
                        open={pinDialogOpen}
                        onOpenChange={setPinDialogOpen}
                        members={currentSession?.members || []}
                        onSuccess={handlePinSuccess}
                        title={pendingAction === 'handover' ? "근무 교대 승인" : "업무일지 결재"}
                        description={pendingAction === 'handover'
                            ? "근무를 종료하고 다음 조에게 인계하시겠습니까? 책임자의 확인이 필요합니다."
                            : "업무일지를 최종 승인하시겠습니까? 서명 후에는 수정이 제한될 수 있습니다."}
                    />

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
                                <div className="w-[180px] border-r border-black flex items-center justify-center font-handwriting text-base">
                                    {shiftType === 'day' ? '07:30 ~ 19:00' : '18:30 ~ 08:00'}
                                </div>
                                {/* Director */}
                                <div className={`flex-1 border-r border-black p-1 flex ${workers.director.length === 2 ? 'flex-row items-center' : 'flex-col justify-center'} gap-1 relative group`}>
                                    {workers.director.map((name, index) => (
                                        <Input
                                            key={index}
                                            className={`h-6 text-center border-none shadow-none focus-visible:ring-0 p-0 font-handwriting text-lg ${workers.director.length === 2 ? 'flex-1' : 'w-full'}`}
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
                                <div className={`flex-1 border-r border-black p-1 flex ${workers.assistant.length === 2 ? 'flex-row items-center' : 'flex-col justify-center'} gap-1 relative group`}>
                                    {workers.assistant.map((name, index) => (
                                        <Input
                                            key={index}
                                            className={`h-6 text-center border-none shadow-none focus-visible:ring-0 p-0 font-handwriting text-lg ${workers.assistant.length === 2 ? 'flex-1' : 'w-full'}`}
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
                                <div className={`flex-1 p-1 flex ${workers.video.length === 2 ? 'flex-row items-center' : 'flex-col justify-center'} gap-1 relative group`}>
                                    {workers.video.map((name, index) => (
                                        <Input
                                            key={index}
                                            className={`h-6 text-center border-none shadow-none focus-visible:ring-0 p-0 font-handwriting text-lg ${workers.video.length === 2 ? 'flex-1' : 'w-full'}`}
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
                                <ChannelRow
                                    name="MBC SPORTS+"
                                    worklogId={id}
                                    posts={channelLogs["MBC SPORTS+"]?.posts || []}
                                    onPostsChange={(posts) => setChannelLogs(prev => ({ ...prev, "MBC SPORTS+": { ...prev["MBC SPORTS+"], posts, timecodes: prev["MBC SPORTS+"]?.timecodes || {} } }))}
                                    timecodeEntries={channelLogs["MBC SPORTS+"]?.timecodes || {}}
                                    onTimecodesChange={(entries) => handleTimecodesChange("MBC SPORTS+", entries)}
                                    onNewPost={() => handleNewPostRequest("MBC SPORTS+", "channel-operation", "MBC SPORTS+", "MBC SPORTS+")}
                                />
                            </div>

                            {/* MBC Every1 */}
                            <div className="border-b border-black flex-1">
                                <ChannelRow
                                    name="MBC Every1"
                                    worklogId={id}
                                    posts={channelLogs["MBC Every1"]?.posts || []}
                                    onPostsChange={(posts) => setChannelLogs(prev => ({ ...prev, "MBC Every1": { ...prev["MBC Every1"], posts, timecodes: prev["MBC Every1"]?.timecodes || {} } }))}
                                    timecodeEntries={channelLogs["MBC Every1"]?.timecodes || {}}
                                    onTimecodesChange={(entries) => handleTimecodesChange("MBC Every1", entries)}
                                    onNewPost={() => handleNewPostRequest("MBC Every1", "channel-operation", "MBC Every1", "MBC Every1")}
                                />
                            </div>

                            {/* MBC DRAMA */}
                            <div className="border-b border-black flex-1">
                                <ChannelRow
                                    name="MBC DRAMA"
                                    worklogId={id}
                                    posts={channelLogs["MBC DRAMA"]?.posts || []}
                                    onPostsChange={(posts) => setChannelLogs(prev => ({ ...prev, "MBC DRAMA": { ...prev["MBC DRAMA"], posts, timecodes: prev["MBC DRAMA"]?.timecodes || {} } }))}
                                    timecodeEntries={channelLogs["MBC DRAMA"]?.timecodes || {}}
                                    onTimecodesChange={(entries) => handleTimecodesChange("MBC DRAMA", entries)}
                                    onNewPost={() => handleNewPostRequest("MBC DRAMA", "channel-operation", "MBC DRAMA", "MBC DRAMA")}
                                />
                            </div>

                            {/* MBC M */}
                            <div className="border-b border-black flex-1">
                                <ChannelRow
                                    name="MBC M"
                                    worklogId={id}
                                    posts={channelLogs["MBC M"]?.posts || []}
                                    onPostsChange={(posts) => setChannelLogs(prev => ({ ...prev, "MBC M": { ...prev["MBC M"], posts, timecodes: prev["MBC M"]?.timecodes || {} } }))}
                                    timecodeEntries={channelLogs["MBC M"]?.timecodes || {}}
                                    onTimecodesChange={(entries) => handleTimecodesChange("MBC M", entries)}
                                    onNewPost={() => handleNewPostRequest("MBC M", "channel-operation", "MBC M", "MBC M")}
                                />
                            </div>

                            {/* MBC ON */}
                            <div className="border-b border-black flex-1">
                                <ChannelRow
                                    name="MBC ON"
                                    worklogId={id}
                                    posts={channelLogs["MBC ON"]?.posts || []}
                                    onPostsChange={(posts) => setChannelLogs(prev => ({ ...prev, "MBC ON": { ...prev["MBC ON"], posts, timecodes: prev["MBC ON"]?.timecodes || {} } }))}
                                    timecodeEntries={channelLogs["MBC ON"]?.timecodes || {}}
                                    onTimecodesChange={(entries) => handleTimecodesChange("MBC ON", entries)}
                                    onNewPost={() => handleNewPostRequest("MBC ON", "channel-operation", "MBC ON", "MBC ON")}
                                />
                            </div>

                        </div>

                        {/* System Issues */}
                        <div className="border border-black border-t-0 shrink-0">
                            <div className="bg-gray-100 py-0.5 text-center text-sm font-bold border-b border-black">장비 및 시스템 주요사항</div>
                            <div className="h-32 p-1 overflow-y-auto">
                                {systemIssues && systemIssues.length > 0 ? (
                                    <ul className="list-none space-y-1">
                                        {systemIssues.map(post => (
                                            <li key={post.id}
                                                onClick={() => router.push(`/posts/${post.id}`)}
                                                className="cursor-pointer hover:bg-gray-100 rounded text-sm group flex items-start"
                                            >
                                                <span className="mr-1">•</span>
                                                <span className="group-hover:underline">{post.summary}</span>
                                            </li>
                                        ))}
                                        {systemIssues.length < 5 && (
                                            <li
                                                onClick={() => handleNewPostRequest('systemIssues', 'system-issue', '장비&시스템')}
                                                className="cursor-pointer text-gray-400 hover:text-gray-600 text-sm mt-1 print:hidden"
                                            >
                                                + 추가
                                            </li>
                                        )}
                                    </ul>
                                ) : (
                                    <div
                                        onClick={() => handleNewPostRequest('systemIssues', 'system-issue', '장비&시스템')}
                                        className="h-full w-full text-sm text-gray-400 cursor-pointer hover:bg-gray-50 flex items-start pt-1"
                                    >
                                        특이사항 없음
                                    </div>
                                )}
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
