"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Printer, Save, RefreshCw, PenTool } from "lucide-react"
import { cn } from "@/lib/utils"
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useWorklogStore, Worklog, ChannelLog } from "@/store/worklog"
import { useAuthStore } from "@/store/auth"
import { useWorklogTabStore } from "@/store/worklog-tab-store"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { shiftService } from "@/lib/shift-rotation"
import { format, subDays, isToday, isYesterday } from "date-fns"
import { ko } from "date-fns/locale"

// Extracted Components
import { ChannelRow } from "./channel-row"
import { SystemIssuesList } from "./system-issues-list"

interface WorklogDetailProps {
    worklogId?: string | null
    tabDate?: string
    tabType?: string
    tabTeam?: string
}

export function WorklogDetail({ worklogId: propWorklogId, tabDate, tabType, tabTeam }: WorklogDetailProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Use prop ID if available, otherwise check search params (for backward compatibility or direct links)
    const id = propWorklogId || searchParams.get('id')

    // Use TAB PROPS FIRST, then fall back to searchParams
    const paramTeam = tabTeam || searchParams.get('team')
    const paramType = tabType || searchParams.get('type')
    const paramDate = tabDate || searchParams.get('date')

    const { worklogs, addWorklog, updateWorklog, fetchWorklogById, fetchWorklogs, fetchWorklogPosts, fetchWorklogChannelData } = useWorklogStore()
    const { user, currentSession, nextSession, promoteNextSession } = useAuthStore()

    // Initialize state from props if available
    const getInitialShiftType = (): 'day' | 'night' => {
        if (paramType === 'day' || paramType === 'night') return paramType
        if (paramType === '주간') return 'day'
        if (paramType === '야간') return 'night'
        return 'day'  // Default
    }

    const getInitialDate = (): Date => {
        if (paramDate) {
            const [year, month, day] = paramDate.split('-').map(Number)
            return new Date(year, month - 1, day)
        }
        return new Date()
    }

    const [selectedDate, setSelectedDate] = useState<Date>(getInitialDate)
    const [shiftType, setShiftType] = useState<'day' | 'night'>(getInitialShiftType)
    const [selectedTeam, setSelectedTeam] = useState<string | null>(paramTeam || null)
    const [workers, setWorkers] = useState<{ director: string[], assistant: string[], video: string[] }>({
        director: [],
        assistant: [],
        video: []
    })
    const [status, setStatus] = useState<Worklog['status']>('작성중')
    const [channelLogs, setChannelLogs] = useState<{ [key: string]: ChannelLog }>({})
    const [systemIssues, setSystemIssues] = useState<{ id: string; summary: string }[]>([])
    const [pinDialogOpen, setPinDialogOpen] = useState(false)
    const [pendingAction, setPendingAction] = useState<'handover' | 'sign' | null>(null)
    const [signingType, setSigningType] = useState<'operation' | 'team_leader' | 'mcr' | 'network' | null>(null)

    // Sync state from props when they change (useState initializer only runs on first mount)
    useEffect(() => {
        // Sync shiftType from paramType
        if (paramType) {
            if (paramType === 'day' || paramType === 'night') {
                setShiftType(paramType)
            } else if (paramType === '주간') {
                setShiftType('day')
            } else if (paramType === '야간') {
                setShiftType('night')
            }
        }

        // Sync team
        if (paramTeam) {
            setSelectedTeam(paramTeam)
        }

        // Sync date
        if (paramDate) {
            const [year, month, day] = paramDate.split('-').map(Number)
            setSelectedDate(new Date(year, month - 1, day))
        }
    }, [paramType, paramTeam, paramDate])

    // [NEW] Fetch member types for permission check
    const [memberTypes, setMemberTypes] = useState<{ [key: string]: string }>({})

    useEffect(() => {
        const fetchMemberTypes = async () => {
            if (!currentSession?.members) return
            const ids = currentSession.members.map(m => m.id)
            if (ids.length === 0) return

            const { data } = await supabase
                .from('users')
                .select('id, type')
                .in('id', ids)

            if (data) {
                const typeMap: { [key: string]: string } = {}
                data.forEach((u: any) => {
                    typeMap[u.id] = u.type
                })
                setMemberTypes(typeMap)
            }
        }
        fetchMemberTypes()
    }, [currentSession?.members])
    const [ignore, setIgnore] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [lastSaved, setLastSaved] = useState<Date | null>(null)
    const [isDirty, setIsDirty] = useState(false)
    const [isLoaded, setIsLoaded] = useState(false)

    // Track fetch attempts to prevent infinite loops
    const fetchAttempted = useRef<Set<string>>(new Set())

    // Post Creation Confirmation State
    const [pendingPost, setPendingPost] = useState<{
        sourceField: string;
        categorySlug: string;
        tag: string;
        channel?: string;
    } | null>(null)

    // Determine Active Tab
    const [activeTab, setActiveTab] = useState<string>("current")
    const [timeRange, setTimeRange] = useState('')

    // [New] Auto-update time range based on strict defaults when Shift Type changes
    useEffect(() => {
        if (shiftType === 'day') {
            if (!timeRange || timeRange === '18:30 ~ 08:00') setTimeRange('07:30 ~ 19:00')
        } else {
            if (!timeRange || timeRange === '07:30 ~ 19:00') setTimeRange('18:30 ~ 08:00')
        }
    }, [shiftType])

    // Sync activeTab with selectedTeam
    useEffect(() => {
        if (nextSession) {
            // If we are viewing the next session's team, active tab is 'next'
            if (selectedTeam === nextSession.groupName) {
                setActiveTab("next")
            } else {
                setActiveTab("current")
            }
        } else {
            // If nextSession is removed (cancelled), revert to current tab
            if (activeTab !== 'current') setActiveTab("current")

            // Also revert to current team if we were viewing the next team
            // BUT SKIP if paramTeam is provided (creating worklog for different team via dialog)
            if (currentSession && selectedTeam !== currentSession.groupName && !paramTeam) {
                setSelectedTeam(currentSession.groupName)
            }
        }
    }, [selectedTeam, nextSession, currentSession, paramTeam])

    // ... (existing state)

    // Auto-save effect
    useEffect(() => {
        if (!id || id === 'new') return
        if (!isLoaded) return

        setIsDirty(true) // Mark as dirty when dependencies change

        const timer = setTimeout(async () => {
            setIsSaving(true)
            // @ts-ignore
            await updateWorklog(id, {
                groupName: selectedTeam || '',
                type: shiftType === 'day' ? '주간' : '야간',
                workers: workers,
                channelLogs: channelLogs,
                systemIssues: systemIssues
            })
            setIsSaving(false)
            setLastSaved(new Date())
            setIsDirty(false)
        }, 3000)

        return () => clearTimeout(timer)
    }, [id, selectedTeam, shiftType, workers, channelLogs, systemIssues, updateWorklog, isLoaded])

    // Warn before unload if dirty
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty || isSaving) {
                e.preventDefault()
                e.returnValue = ''
            }
        }
        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [isDirty, isSaving])

    // ... (rest of the component)

    // In the render return, add the indicator near the buttons
    // ...


    // Initial fetch logic
    useEffect(() => {
        if (id && id !== 'new') {
            fetchWorklogById(id).then(() => {
                // Lazy load channel data after worklog is loaded
                fetchWorklogChannelData(id).then(({ channelLogs: loadedChannelLogs, systemIssues: loadedSystemIssues }) => {
                    setChannelLogs(loadedChannelLogs)
                    setSystemIssues(loadedSystemIssues)
                })
            })
        } else {
            fetchWorklogs()
        }
    }, [id, fetchWorklogById, fetchWorklogs, fetchWorklogChannelData])

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
    }, [id, paramTeam, currentSession, worklogs])

    // Handle Query Params Override
    useEffect(() => {
        const paramDate = searchParams.get('date')
        if (paramDate) {
            const [year, month, day] = paramDate.split('-').map(Number)
            setSelectedDate(new Date(year, month - 1, day))
        }
        if (paramTeam) setSelectedTeam(paramTeam)
        // Parse shiftType properly (can be 'day'/'night' or '주간'/'야간')
        if (paramType) {
            if (paramType === 'day' || paramType === 'night') {
                setShiftType(paramType)
            } else if (paramType === '주간') {
                setShiftType('day')
            } else if (paramType === '야간') {
                setShiftType('night')
            }
        }
    }, [searchParams, paramTeam, paramType])

    // [FIX] Reset isLoaded when id changes to ensure data is reloaded
    const prevIdRef = useRef<string | undefined>(id)
    useEffect(() => {
        if (prevIdRef.current !== id) {
            prevIdRef.current = id
            setIsLoaded(false)
        }
    }, [id])

    // Sync state from store (Existing Worklogs)
    useEffect(() => {
        let ignore = false

        // [FIX] Skip if already loaded, UNLESS workers are still empty and we have currentSession
        const workersAreEmpty = !workers.director?.length && !workers.assistant?.length && !workers.video?.length
        const shouldRepopulateWorkers = isLoaded && workersAreEmpty && currentSession

        if (isLoaded && !shouldRepopulateWorkers) return

        if (id && id !== 'new') {
            const worklog = worklogs.find(w => String(w.id) === id)
            if (worklog) {
                // Parse date string (YYYY-MM-DD) to Date object
                const [yearStr, monthStr, dayStr] = worklog.date.split('-')
                const dateObj = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr))

                if (!ignore) {
                    setSelectedDate(dateObj)
                    setShiftType(worklog.type === '주간' ? 'day' : 'night')
                    setSelectedTeam(worklog.groupName)
                }

                // [FIX] If stored workers are empty, try to populate from currentSession or roster
                const hasWorkers = worklog.workers && (
                    worklog.workers.director?.length > 0 ||
                    worklog.workers.assistant?.length > 0 ||
                    worklog.workers.video?.length > 0
                )

                if (hasWorkers) {
                    if (!ignore) setWorkers(worklog.workers)
                } else {
                    // Try to populate from session or config

                    // 1. Try currentSession if it matches the worklog's team (SYNC - fast path)
                    // NOTE: currentSession.members already has swap applied during login.
                    if (currentSession && currentSession.groupName === worklog.groupName) {
                        const newWorkers = {
                            director: [] as string[],
                            assistant: [] as string[],
                            video: [] as string[]
                        }

                        currentSession.members.forEach(m => {
                            const role = (m.role || '').split(',')[0].trim()
                            if (role === '감독') {
                                newWorkers.director.push(m.name)
                            } else if (role === '부감독') {
                                newWorkers.assistant.push(m.name)
                            } else {
                                newWorkers.video.push(m.name)
                            }
                        })

                        if (!ignore) setWorkers(newWorkers)
                    } else {
                        // 2. Async fallback: Try roster_json from config
                        const populateFromRoster = async () => {
                            const config = await shiftService.getConfig(dateObj)
                            if (ignore) return

                            if (config?.roster_json?.[worklog.groupName]) {
                                const rosterMembers = shiftService.getMembersWithRoles(worklog.groupName, dateObj, config)
                                if (rosterMembers.length > 0) {
                                    const newWorkers = {
                                        director: [] as string[],
                                        assistant: [] as string[],
                                        video: [] as string[]
                                    }
                                    rosterMembers.forEach(m => {
                                        if (m.role === '감독') newWorkers.director.push(m.name)
                                        else if (m.role === '부감독') newWorkers.assistant.push(m.name)
                                        else newWorkers.video.push(m.name)
                                    })
                                    setWorkers(newWorkers)
                                    return
                                }
                            }
                            // 3. Fallback: use empty workers
                            setWorkers(worklog.workers)
                            // @ts-ignore
                            if (worklog.workers?.time_range) {
                                // @ts-ignore
                                setTimeRange(worklog.workers.time_range)
                            }
                        }
                        populateFromRoster()
                    }
                }

                // [FIX] Sanitize Status: Remove '서명완료' and re-calculate based on signatures
                let cleanStatus = worklog.status
                if (cleanStatus === '서명완료') cleanStatus = '작성중'

                const sigs = (worklog.signatures || {}) as any
                // 1. Check if all 4 are signed
                if (sigs.operation && sigs.team_leader && sigs.mcr && sigs.network) {
                    cleanStatus = '결재완료'
                }
                // 2. Check for '일지확정' condition (Director signed + After Hours)
                else if (sigs.operation) {
                    const shiftEnd = new Date(dateObj)
                    if (worklog.type === '주간') {
                        shiftEnd.setHours(19, 0, 0, 0)
                    } else {
                        shiftEnd.setDate(shiftEnd.getDate() + 1)
                        shiftEnd.setHours(8, 0, 0, 0)
                    }
                    if (new Date() >= shiftEnd) {
                        cleanStatus = '일지확정'
                    } else {
                        cleanStatus = '작성중'
                    }
                }

                if (!ignore) setStatus(cleanStatus)

                // Fetch latest posts to ensure sync
                fetchWorklogPosts(id).then(posts => {
                    if (ignore) return

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

                    // 기존 systemIssues 순서를 유지하면서 정렬
                    const existingOrder = systemIssues.map(s => s.id)
                    newSystemIssues.sort((a, b) => {
                        const aIndex = existingOrder.indexOf(a.id)
                        const bIndex = existingOrder.indexOf(b.id)
                        // 기존에 없던 항목은 맨 뒤로
                        if (aIndex === -1) return 1
                        if (bIndex === -1) return -1
                        return aIndex - bIndex
                    })

                    // Only update if actually changed to avoid re-renders
                    if (JSON.stringify(newChannelLogs) !== JSON.stringify(channelLogs)) {
                        setChannelLogs(newChannelLogs)
                    }

                    if (JSON.stringify(newSystemIssues) !== JSON.stringify(systemIssues)) {
                        setSystemIssues(newSystemIssues)
                    }

                    setIsLoaded(true) // Data loaded

                    // [FIX] Force update tab title to prevent "Loading..." state
                    if (id) {
                        const title = `${worklog.date} ${worklog.groupName}`
                        useWorklogTabStore.getState().updateTab(id, {
                            title,
                            date: worklog.date,
                            type: worklog.type,
                            team: worklog.groupName
                        })
                    }
                })

                if (!ignore) {
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
                // Not found in store, try fetching
                if (!fetchAttempted.current.has(id)) {
                    fetchAttempted.current.add(id)
                    fetchWorklogById(id).then((fetchedLog: Worklog | null) => {
                        if (ignore) return
                        if (fetchedLog) {
                            // Manually set state if fetched
                            const [yearStr, monthStr, dayStr] = fetchedLog.date.split('-')
                            const dateObj = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr))
                            setSelectedDate(dateObj)
                            setShiftType(fetchedLog.type === '주간' ? 'day' : 'night')
                            setSelectedTeam(fetchedLog.groupName)
                            setWorkers(fetchedLog.workers)
                            // @ts-ignore
                            if (fetchedLog.workers?.time_range) {
                                // @ts-ignore
                                setTimeRange(fetchedLog.workers.time_range)
                            }
                            setWorkers(fetchedLog.workers)
                            setStatus(fetchedLog.status)
                            setChannelLogs(fetchedLog.channelLogs || {})
                            setSystemIssues(fetchedLog.systemIssues || [])
                            setIsLoaded(true) // Data loaded

                            // [FIX] Force update tab title
                            const title = `${fetchedLog.date} ${fetchedLog.groupName}`
                            useWorklogTabStore.getState().updateTab(id, {
                                title,
                                date: fetchedLog.date,
                                type: fetchedLog.type,
                                team: fetchedLog.groupName
                            })
                        } else {
                            toast.error("업무일지를 찾을 수 없습니다.")
                            router.replace('/worklog')
                        }
                    })
                }
            }
        } else if (!id || id === 'new') {
            // [FIX] If workers already have data, skip this effect to preserve them on shiftType change
            const workersHaveData = workers.director?.length > 0 || workers.assistant?.length > 0 || workers.video?.length > 0
            if (workersHaveData && isLoaded) {
                return
            }

            // New Worklog: Check if a worklog already exists for today/team/shift
            const dateStr = format(selectedDate, 'yyyy-MM-dd')
            let effectiveShiftType = paramType ? (paramType === 'day' ? '주간' : '야간') : (shiftType === 'day' ? '주간' : '야간')
            let effectiveTeamName = paramTeam || selectedTeam

            if (activeTab === 'next' && nextSession) {
                effectiveTeamName = nextSession.groupName
                const hour = new Date().getHours()
                const isDayTime = hour >= 7 && hour < 18
                if ((!paramType && shiftType === 'day') || (currentSession && isDayTime)) {
                    effectiveShiftType = '야간'
                }
            }

            const checkKey = `${dateStr}-${effectiveTeamName}-${effectiveShiftType}`

            const existingWorklog = worklogs.find(w =>
                w.date === dateStr &&
                w.groupName === effectiveTeamName &&
                w.type === effectiveShiftType
            )

            if (existingWorklog) {
                const mode = searchParams.get('mode')
                if (mode === 'today') {
                    if (!ignore) {
                        setWorkers(existingWorklog.workers)
                        // [New] Load custom time range if saved
                        // @ts-ignore
                        if (existingWorklog.workers?.time_range) {
                            // @ts-ignore
                            setTimeRange(existingWorklog.workers.time_range)
                        } else {
                            // Fallback for old logs
                            setTimeRange(existingWorklog.type === '주간' ? '07:30 ~ 19:00' : '18:30 ~ 08:00')
                        }

                        setChannelLogs(existingWorklog.channelLogs || {})
                        setSystemIssues(existingWorklog.systemIssues || [])
                        setStatus(existingWorklog.status)
                        setSelectedTeam(existingWorklog.groupName)
                        setShiftType(existingWorklog.type === '주간' ? 'day' : 'night')
                        setIsLoaded(true)
                    }
                    return
                }
                router.replace(`/worklog?id=${existingWorklog.id}`)
                return
            }

            const checkServerForDuplicate = async () => {
                console.log("Checking duplicates for:", { dateStr, effectiveTeamName, effectiveShiftType })
                const { data: serverLogs } = await supabase
                    .from('worklogs')
                    .select('id')
                    .eq('date', dateStr)
                    .eq('group_name', effectiveTeamName)
                    .eq('type', effectiveShiftType)
                    .limit(1)

                if (serverLogs && serverLogs.length > 0) {
                    console.log("Found duplicate on server:", serverLogs[0].id)
                    toast.info("이미 생성된 업무일지가 있어 해당 일지로 이동합니다.")
                    router.replace(`/worklog?id=${serverLogs[0].id}`)
                    return true
                }
                console.log("No duplicate found on server.")
                return false
            }

            checkServerForDuplicate().then(exists => {
                if (ignore || exists) return

                if (activeTab === 'next' && nextSession && selectedTeam === nextSession.groupName) {
                    const checkSwapAndSet = async () => {
                        const config = await shiftService.getConfig(selectedDate)
                        if (ignore) return

                        let isSwap = false
                        if (config) {
                            const info = shiftService.calculateShift(selectedDate, selectedTeam, config)
                            isSwap = info.isSwap
                        }

                        const newWorkers = {
                            director: [] as string[],
                            assistant: [] as string[],
                            video: [] as string[]
                        }
                        nextSession.members.forEach(m => {
                            const primaryRole = (m.role || '').split(',')[0].trim()
                            if (primaryRole === '감독') {
                                if (isSwap) newWorkers.assistant.push(m.name)
                                else newWorkers.director.push(m.name)
                            } else if (primaryRole === '부감독') {
                                if (isSwap) newWorkers.director.push(m.name)
                                else newWorkers.assistant.push(m.name)
                            } else {
                                newWorkers.video.push(m.name)
                            }
                        })
                        setWorkers(newWorkers)
                    }
                    checkSwapAndSet()
                }
                setIsLoaded(true)

                // [FIX] Force update tab title for NEW worklogs too
                const title = `${format(selectedDate, 'yyyy-MM-dd')} ${selectedTeam}`
                useWorklogTabStore.getState().updateTab('new', {
                    title,
                    date: format(selectedDate, 'yyyy-MM-dd'),
                    type: effectiveShiftType === 'day' ? '주간' : '야간',
                    team: selectedTeam || undefined
                })
            })
        }

        return () => { ignore = true }
    }, [id, worklogs, selectedTeam, shiftType, paramType, activeTab, nextSession, currentSession, currentSession?.members])

    // [New] Auto-save for newly created worklogs to ensure persistence immediately
    // This solves the issue of user navigating away before saving and losing the 'created' status in list
    const hasAutoSaved = useRef(false)
    useEffect(() => {
        if (id === 'new' && isLoaded && selectedTeam && !hasAutoSaved.current) {
            // Check if workers are populated at least partially to avoid empty saves
            const hasWorkers = workers.director.length > 0 || workers.assistant.length > 0

            if (hasWorkers) {
                hasAutoSaved.current = true
                console.log("Auto-saving new worklog...")
                // Small delay to ensure state is settled
                setTimeout(() => {
                    handleSave(true) // Silent save
                }, 500)
            }
        }
    }, [id, isLoaded, selectedTeam, workers])

    // [Auto-Save 1] Critical Metadata (Shift/Team): Save quickly (200ms) to prevent data loss on nav
    useEffect(() => {
        if (!id || id === 'new' || !isLoaded) return

        const timer = setTimeout(() => {
            console.log("Auto-saving critical metadata (Shift/Team)...")
            handleSave(true)
        }, 200)

        return () => clearTimeout(timer)
    }, [shiftType, selectedTeam, id, isLoaded])

    // [Auto-Save 2] Workers: Debounce (1000ms) to avoid spamming during multi-selection
    useEffect(() => {
        if (!id || id === 'new' || !isLoaded) return

        const timer = setTimeout(() => {
            console.log("Auto-saving workers...")
            handleSave(true)
        }, 1000)

        return () => clearTimeout(timer)
    }, [workers, id, isLoaded])

    // Smart Initialization: Determine initial Date and Shift Type
    // Prioritizes logged-in user's active shift over strict time-based shift to prevent auto-switching during handover.
    useEffect(() => {
        if ((id && id !== 'new') || paramType) return // Skip if existing ID or params exist
        if (isLoaded) return // [FIX] Stop re-initializing if page is already loaded (user might have changed settings)

        const initializeSmartShift = async () => {
            const now = new Date()
            let { date: targetDate, shiftType: logicalShiftType } = shiftService.getLogicalShiftInfo(now)

            // If user is logged in, check if we should stick to their shift
            if (currentSession) {
                const config = await shiftService.getConfig(targetDate)
                if (config) {
                    const teams = shiftService.getTeamsForDate(targetDate, config)
                    if (teams) {
                        // Case 1: Time is Night, but User is Day Team (e.g. 18:31 Handover)
                        if (logicalShiftType === 'night' && currentSession.groupName === teams.A) {
                            logicalShiftType = 'day'
                            // Date remains Today
                        }
                        // Case 2: Time is Day (Next Morning), but User is Night Team (e.g. 08:00 Handover)
                        else if (logicalShiftType === 'day' && currentSession.groupName === teams.N) {
                            // Check if they were Night Team for YESTERDAY
                            const yesterday = subDays(targetDate, 1)
                            const prevConfig = await shiftService.getConfig(yesterday)
                            if (prevConfig) {
                                const prevTeams = shiftService.getTeamsForDate(yesterday, prevConfig)
                                if (prevTeams && prevTeams.N === currentSession.groupName) {
                                    logicalShiftType = 'night'
                                    targetDate = yesterday
                                }
                            }
                        }
                    }
                }
            }

            // [FIX] Only update if actually different to prevent re-triggering 'updateTeamFromPattern'
            const isSameDate = format(targetDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
            const isSameShift = logicalShiftType === shiftType

            if (!isSameDate) setSelectedDate(targetDate)
            if (!isSameShift) setShiftType(logicalShiftType)
        }

        initializeSmartShift()
    }, [id, paramType, currentSession, selectedDate, shiftType])

    // [NEW] Dedicated effect to populate workers when currentSession loads late
    // [NEW] Dedicated effect to populate workers when currentSession loads late
    useEffect(() => {
        if (!currentSession) return
        if (!selectedTeam || selectedTeam !== currentSession.groupName) return
        if (!((!id || id === 'new') && activeTab === 'current')) return

        // Check if workers are empty
        const workersAreEmpty = !workers.director?.length && !workers.assistant?.length && !workers.video?.length
        if (!workersAreEmpty) return

        // [FIX] Ensure we only use currentSession if it matches Today AND the same shift type
        const now = new Date()
        const isToday = format(selectedDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')
        const { shiftType: currentLinkShift } = shiftService.getLogicalShiftInfo(now)
        const isSameShiftType = shiftType === currentLinkShift

        if (!isToday || !isSameShiftType) return

        // Populate from currentSession.members (roles already have swap applied)
        const newWorkers = {
            director: [] as string[],
            assistant: [] as string[],
            video: [] as string[]
        }

        currentSession.members.forEach(m => {
            const role = (m.role || '').split(',')[0].trim()
            if (role === '감독') {
                newWorkers.director.push(m.name)
            } else if (role === '부감독') {
                newWorkers.assistant.push(m.name)
            } else {
                newWorkers.video.push(m.name)
            }
        })

        setWorkers(newWorkers)
    }, [currentSession, selectedTeam, workers, id, activeTab, selectedDate, shiftType])

    // [Restored] One-time default to user's team if no team is selected
    useEffect(() => {
        // Only set if completely unset. This fills the initial state.
        if (!selectedTeam && currentSession) {
            setSelectedTeam(currentSession.groupName)
        }
    }, [currentSession, selectedTeam])

    // Fetch group members when team changes (only if no ID or creating new)
    useEffect(() => {
        let ignore = false

        // [FIX] Skip if already loaded to prevent overwriting saved workers
        // BUT allow if it is a NEW log and workers are empty (or if we need to fetch for the selected team)
        // Actually, for 'new' logs, this effect is the primary way to fetch workers when team changes or on init.
        // So we only block for EXISTING (saved) logs that are loaded.
        if (isLoaded && id !== 'new') return

        // If we are in Next Session tab, we already set workers from session members in the previous effect
        if (activeTab === 'next' && nextSession && selectedTeam === nextSession.groupName) return

        // [Modified] Use currentSession members if available and matches selectedTeam AND IS TODAY AND SAME SHIFT
        // We do this EVEN IF id exists, to ensure the displayed workers match the logged-in session (user request)
        const now = new Date()
        const isToday = format(selectedDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')
        const { shiftType: currentLinkShift } = shiftService.getLogicalShiftInfo(now)
        const isSameShiftType = shiftType === currentLinkShift

        if ((!id || id === 'new') && currentSession && selectedTeam === currentSession.groupName && activeTab === 'current' && isToday && isSameShiftType) {
            const checkSwapAndSet = async () => {
                const config = await shiftService.getConfig(selectedDate)
                let isSwap = false
                if (config) {
                    const info = shiftService.calculateShift(selectedDate, selectedTeam, config)
                    isSwap = info.isSwap
                }

                const newWorkers = {
                    director: [] as string[],
                    assistant: [] as string[],
                    video: [] as string[]
                }
                currentSession.members.forEach(m => {
                    const primaryRole = (m.role || '').split(',')[0].trim()
                    if (primaryRole === '감독') {
                        if (isSwap) newWorkers.assistant.push(m.name)
                        else newWorkers.director.push(m.name)
                    } else if (primaryRole === '부감독') {
                        if (isSwap) newWorkers.director.push(m.name)
                        else newWorkers.assistant.push(m.name)
                    } else {
                        newWorkers.video.push(m.name)
                    }
                })
                if (!ignore) setWorkers(newWorkers)
            }
            checkSwapAndSet()
            return () => { ignore = true }
        }

        if (id && id !== 'new') return // Don't fetch for existing logs (they have their own workers saved)

        // [FIX] Skip if workers already have data (preserve existing workers on shiftType change)
        const workersHaveData = workers.director?.length > 0 || workers.assistant?.length > 0 || workers.video?.length > 0
        if (workersHaveData) return

        const fetchGroupMembers = async () => {
            if (!selectedTeam) return

            // Reset workers to empty to prevent showing previous team's workers while loading
            if (!ignore) {
                setWorkers({
                    director: [],
                    assistant: [],
                    video: []
                })
            }

            try {
                // 1. Try to fetch from Configuration Roster (Future/Past Roster Snapshot)
                const config = await shiftService.getConfig(selectedDate)
                if (ignore) return

                if (config && config.roster_json && config.roster_json[selectedTeam]) {
                    // roster_json is now { 감독: "name", 부감독: "name", 영상: "name" }
                    // Use getMembersWithRoles which handles the structure and swap logic
                    const rosterMembers = shiftService.getMembersWithRoles(selectedTeam, selectedDate, config)

                    if (rosterMembers.length > 0 && !ignore) {
                        const newWorkers = {
                            director: [] as string[],
                            assistant: [] as string[],
                            video: [] as string[]
                        }

                        rosterMembers.forEach(m => {
                            if (m.role === '감독') {
                                newWorkers.director.push(m.name)
                            } else if (m.role === '부감독') {
                                newWorkers.assistant.push(m.name)
                            } else {
                                newWorkers.video.push(m.name)
                            }
                        })

                        setWorkers(newWorkers)
                        return // Exit if successful
                    }
                }

                // 2. Fallback to Current Live Roster (group_members)
                const { data: members, error: membersError } = await supabase
                    .from('group_members')
                    .select(`
                        user:users(name, role),
                        group:groups!inner(name)
                    `)
                    .eq('group.name', selectedTeam)
                    .order('display_order', { ascending: true })

                if (membersError) throw membersError

                if (members && !ignore) {
                    // Check swap (need config)
                    const config = await shiftService.getConfig(selectedDate)
                    let isSwap = false
                    if (config) {
                        const info = shiftService.calculateShift(selectedDate, selectedTeam, config)
                        isSwap = info.isSwap
                    }

                    const newWorkers = {
                        director: [] as string[],
                        assistant: [] as string[],
                        video: [] as string[]
                    }

                    // Filter out video staff first
                    const daMembers: any[] = []
                    members.forEach((m: any) => {
                        if (m.user) {
                            const primaryRole = (m.user.role || '').split(',')[0].trim()
                            if (primaryRole === '영상') {
                                newWorkers.video.push(m.user.name)
                            } else {
                                daMembers.push(m.user)
                            }
                        }
                    })

                    // Assign Director/Assistant based on order
                    if (daMembers.length > 0) {
                        // Normal: 0->Director, 1->Assistant
                        // Swap: 0->Assistant, 1->Director
                        const idx0 = isSwap ? 'assistant' : 'director'
                        const idx1 = isSwap ? 'director' : 'assistant'

                        if (daMembers[0]) newWorkers[idx0].push(daMembers[0].name)
                        if (daMembers[1]) newWorkers[idx1].push(daMembers[1].name)

                        // If more than 2, assign rest as assistant? or video? 
                        // Usually only 2 DA members.
                        for (let i = 2; i < daMembers.length; i++) {
                            newWorkers.assistant.push(daMembers[i].name)
                        }
                    }
                    setWorkers(newWorkers)
                }
            } catch (error) {
                if (!ignore) {
                    console.error("Error fetching group members:", error)
                    toast.error("근무자 정보를 불러오는데 실패했습니다.")
                }
            }
        }

        fetchGroupMembers()

        return () => { ignore = true }
    }, [selectedTeam, id, activeTab, nextSession, currentSession, selectedDate, isLoaded, workers.director?.length, workers.assistant?.length, workers.video?.length])

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
        const now = new Date()
        // If it's yesterday's date, but it's a night shift and currently before noon (extended night shift)
        const isExtendedNightShift = isYesterday(selectedDate) && shiftType === 'night' && now.getHours() < 12

        if (isToday(selectedDate) || isExtendedNightShift) {
            if (status === '근무종료' || status === '서명완료') {
                return `오늘 ${shiftType === 'day' ? '주간' : '야간'} 업무일지`
            }
            return 'TODAY 업무일지'
        }
        if (isYesterday(selectedDate)) {
            return '어제 업무일지'
        }
        return `${format(selectedDate, 'M월 d일')} 업무일지`
    }

    const handleSave = async (silent = false) => {
        if (!selectedTeam) {
            if (!silent) toast.error("근무조(팀) 정보가 없습니다. 잠시 후 다시 시도해주세요.")
            return null
        }

        if (id && id !== 'new') {
            // @ts-ignore - ID type mismatch (number vs string)
            const { error } = await updateWorklog(id, {
                groupName: selectedTeam,
                type: shiftType === 'day' ? '주간' : '야간',
                // @ts-ignore
                workers: { ...workers, time_range: timeRange },
                // [FIX] Do NOT update channelLogs/systemIssues here. 
                // They are updated atomically via handleTimecodeUpdate or onNewPost.
                // channelLogs: channelLogs,
                // systemIssues: systemIssues
            })

            if (error) {
                // [FIX] Handle Duplicate Key Error (Unique Constraint)
                // If toggling Day<->Night and the target already exists, switch to it instead of crashing
                if (error.code === '23505' || error.message?.includes('duplicate key')) {
                    console.log("Duplicate collision during update. Finding existing log...")

                    const dateStr = format(selectedDate, 'yyyy-MM-dd')
                    const targetType = shiftType === 'day' ? '주간' : '야간'

                    // Find the ID of the existing log
                    const { data: existing } = await supabase
                        .from('worklogs')
                        .select('id')
                        .eq('group_name', selectedTeam)
                        .eq('date', dateStr)
                        .eq('type', targetType)
                        .maybeSingle()

                    if (existing) {
                        toast.info("이미 존재하는 일지가 있어 이동합니다.")

                        const newUrl = `/worklog?id=${existing.id}`
                        window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl)
                        router.replace(newUrl)
                        return existing.id
                    }
                }

                if (!silent) toast.error("저장에 실패했습니다.")
                return null
            }

            if (!silent) toast.success("저장되었습니다.")
            return id
        } else {
            const now = selectedDate
            const year = now.getFullYear()
            const month = now.getMonth() + 1
            const day = now.getDate()
            const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`

            // [NEW] Pre-check for duplicates before inserting
            console.log('Checking duplicates for:', { dateStr, selectedTeam, shiftType, type: shiftType === 'day' ? '주간' : '야간' })
            const { data: existingLogs } = await supabase
                .from('worklogs')
                .select('id')
                .eq('date', dateStr)
                .eq('group_name', selectedTeam) // [FIX] Must check group name!
                .eq('type', shiftType === 'day' ? '주간' : '야간')
                .is('deleted_at', null) // Only check active (non-deleted) records
                .limit(1)
            console.log('existingLogs:', existingLogs)

            if (existingLogs && existingLogs.length > 0) {
                console.log("handleSave: Duplicate found, redirecting...", existingLogs[0].id)
                if (!silent) toast.info("이미 생성된 업무일지가 있어 해당 일지로 이동합니다.")

                // Redirect to existing
                if (searchParams.get('mode') === 'today') {
                    return existingLogs[0].id
                }
                const newUrl = `/worklog?id=${existingLogs[0].id}`
                window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl)
                router.replace(newUrl)
                return existingLogs[0].id
            }

            const newLog = await addWorklog({
                date: dateStr,
                groupName: selectedTeam,
                type: shiftType === 'day' ? '주간' : '야간',
                // @ts-ignore
                workers: { ...workers, time_range: timeRange },
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
                    if (searchParams.get('mode') === 'today') {
                        // Skip redirect in today mode
                    } else {
                        const newUrl = `/worklog?id=${newLog.id}`
                        window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl)
                        router.replace(newUrl)
                    }
                } else {
                    // Just update history for back button support, don't trigger navigation
                    if (searchParams.get('mode') !== 'today') {
                        const newUrl = `/worklog?id=${newLog.id}`
                        window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl)
                    }
                }
                return newLog.id
            }
            return null
        }
    }

    const handleNewPostRequest = async (sourceField: string, categorySlug: string, tag: string, channel?: string) => {
        let currentId = id
        if (!currentId || currentId === 'new') {
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

    const handleTimecodeUpdate = async (channelName: string, key: number, value: string | undefined) => {
        // 1. Optimistic UI Update
        const currentChannelCodes = { ...(channelLogs[channelName]?.timecodes || {}) }

        if (value === undefined) {
            delete currentChannelCodes[key]
        } else {
            currentChannelCodes[key] = value
        }

        const optimisticLogs = {
            ...channelLogs,
            [channelName]: {
                ...channelLogs[channelName],
                posts: channelLogs[channelName]?.posts || [],
                timecodes: currentChannelCodes
            }
        }
        setChannelLogs(optimisticLogs)

        let currentId = id
        if (currentId === 'new') {
            const savedId = await handleSave(true)
            if (savedId) currentId = String(savedId)
        }

        if (currentId && currentId !== 'new') {
            try {
                // [SAFETY FIX] Fetch latest server data to prevent overwriting other channels
                const { data: serverLog } = await supabase
                    .from('worklogs')
                    .select('channel_logs')
                    .eq('id', currentId)
                    .single()

                const serverChannelLogs = serverLog?.channel_logs || {}

                const targetChannelLog = serverChannelLogs[channelName] || { posts: [], timecodes: {} }
                const targetTimecodes = { ...(targetChannelLog.timecodes || {}) }

                // Apply atomic update to server state base
                if (value === undefined) {
                    delete targetTimecodes[key]
                } else {
                    targetTimecodes[key] = value
                }

                // Construct full update payload
                const safeChannelLogs = {
                    ...serverChannelLogs,
                    [channelName]: {
                        ...targetChannelLog,
                        timecodes: targetTimecodes
                    }
                }

                // @ts-ignore
                await updateWorklog(currentId, {
                    groupName: selectedTeam || '',
                    type: shiftType === 'day' ? '주간' : '야간',
                    workers: workers,
                    channelLogs: safeChannelLogs, // Use the safely merged logs
                    systemIssues: systemIssues
                })

                // Sync local state with the confirmed safe state
                setChannelLogs(safeChannelLogs)

                toast.success("운행표 수정사항이 저장되었습니다.")
            } catch (error) {
                console.error("Failed to save timecodes", error)
                toast.error("저장에 실패했습니다.")
            }
        }
    }

    const handleTabChange = (val: string) => {
        setActiveTab(val)
        if (val === 'current') {
            router.push('/worklog?mode=today')
        } else if (val === 'next' && nextSession) {
            // Switch to next session
            // Calculate next shift type based on CURRENT displayed shift, not the current time
            const nextShift = shiftType === 'day' ? 'night' : 'day'
            router.push(`/worklog?mode=today&team=${nextSession.groupName}&type=${nextShift}`)
        }
    }

    const handlePromoteSession = () => {
        // 1. Check if operation signature exists
        const currentWorklog = worklogs.find(w => String(w.id) === id)

        // Note: We check 'operation' signature.
        if (currentWorklog) {
            // If signatures object exists (new schema)
            if (currentWorklog.signatures && !currentWorklog.signatures.operation) {
                toast.error("운행 결재가 완료되지 않아 로그아웃할 수 없습니다.")
                return
            }
        }

        setPendingAction('handover')
        setPinDialogOpen(true)
    }

    const handleSign = () => {
        setPendingAction('sign')
        setPinDialogOpen(true)
    }

    const handlePinSuccess = async (user: any) => {
        if (pendingAction === 'handover') {
            // Log to audit_logs
            try {
                await supabase.from('audit_logs').insert({
                    user_id: user.id,
                    action: 'HANDOVER_COMPLETE',
                    target_type: 'SESSION',
                    changes: {
                        previous_group: currentSession?.groupName,
                        new_group: nextSession?.groupName,
                        timestamp: new Date().toISOString()
                    }
                })
            } catch (e) {
                console.error("Failed to log handover:", e)
            }

            promoteNextSession()
            router.push('/')
            toast.success(`${user.name}님의 승인으로 근무 교대가 완료되었습니다.`)
        } else if (pendingAction === 'sign') {
            // Existing "Top Button" Sign Logic (Treat as Operation Sign)
            if (id && id !== 'new') {
                // @ts-ignore
                await updateWorklog(id, { status: '서명완료' })
                setStatus('서명완료')
                toast.success(`${user.name}님의 서명이 완료되었습니다.`)
            }
        } else if (signingType && id && id !== 'new') {
            // New Grid Signature Logic
            const currentWorklog = worklogs.find(w => String(w.id) === id)
            if (!currentWorklog) return

            const now = new Date()
            const timeStr = format(now, "MM/dd HH:mm")
            const sigString = `${user.name}|${timeStr}`

            const existingSignatures = currentWorklog.signatures || {
                operation: null,
                mcr: null,
                team_leader: null,
                network: null
            }

            const newSignatures = {
                ...existingSignatures,
                [signingType]: sigString
            }

            // NEW Status Logic
            let newStatus: Worklog['status'] = '작성중'

            if (newSignatures.operation && newSignatures.team_leader && newSignatures.mcr && newSignatures.network) {
                newStatus = '결재완료'
            }
            else if (newSignatures.operation) {
                const shiftEnd = new Date(selectedDate)
                if (shiftType === 'day') {
                    shiftEnd.setHours(19, 0, 0, 0)
                } else {
                    shiftEnd.setDate(shiftEnd.getDate() + 1)
                    shiftEnd.setHours(8, 0, 0, 0)
                }

                if (now >= shiftEnd) {
                    newStatus = '일지확정'
                } else {
                    newStatus = '작성중'
                }
            }

            // @ts-ignore
            await updateWorklog(id, {
                signatures: newSignatures,
                status: newStatus
            })

            if (newStatus === '결재완료') setStatus('결재완료')
            else if (newStatus === '일지확정') setStatus('일지확정')
            else setStatus('작성중')

            toast.success(`${user.name}님의 서명이 저장되었습니다.`)
            setSigningType(null)
        }
        setPendingAction(null)
    }

    const [permissionDeniedOpen, setPermissionDeniedOpen] = useState(false)
    const [permissionDeniedMessage, setPermissionDeniedMessage] = useState("")
    const [signatureCancelOpen, setSignatureCancelOpen] = useState(false)
    const [signatureToDelete, setSignatureToDelete] = useState<'operation' | 'team_leader' | 'mcr' | 'network' | null>(null)

    const handleRemoveSignature = async () => {
        if (!signatureToDelete || !id) return

        try {
            await updateWorklog(id, {
                signatures: {
                    ...worklogs.find(w => String(w.id) === id)?.signatures,
                    [signatureToDelete]: null
                } as any
            })
            toast.success("서명이 삭제되었습니다.")
            setSignatureCancelOpen(false)
            setSignatureToDelete(null)
        } catch (error) {
            console.error("Failed to remove signature:", error)
            toast.error("서명 삭제에 실패했습니다.")
        }
    }

    const handleGridSign = (type: 'operation' | 'team_leader' | 'mcr' | 'network') => {
        if (!user) {
            toast.error("로그인이 필요합니다.")
            return
        }

        const currentWorklog = worklogs.find(w => String(w.id) === id)
        const existingSignature = currentWorklog?.signatures?.[type]

        if (existingSignature) {
            // [Check] Validate Ownership (Name Match)
            const [signerName] = existingSignature.split('|')
            if (signerName && signerName !== user.name) {
                setPermissionDeniedMessage("본인의 서명만 취소할 수 있습니다.")
                setPermissionDeniedOpen(true)
                return
            }

            if (type === 'operation') {
                const isDirector = currentSession?.members.some(m => m.id === user.id && m.role && m.role.includes('감독'))
                if (!isDirector) {
                    setPermissionDeniedMessage("운행 결재 취소는 감독만 가능합니다.")
                    setPermissionDeniedOpen(true)
                    return
                }
            } else {
                const isSupportInSession = memberTypes[user.id] === 'support'
                const isSupportUser = user.type === 'support'
                if (!isSupportInSession && !isSupportUser) {
                    setPermissionDeniedMessage("서명 취소 권한이 없습니다. 관리자만 가능합니다.")
                    setPermissionDeniedOpen(true)
                    return
                }
            }

            setSignatureToDelete(type)
            setSignatureCancelOpen(true)
            return
        }

        if (type === 'operation') {
            const isDirector = currentSession?.members.some(m => m.id === user.id && m.role && m.role.includes('감독'))
            if (!isDirector) {
                setPermissionDeniedMessage("운행 결재는 감독만 가능합니다.")
                setPermissionDeniedOpen(true)
                return
            }
        } else {
            const isSupportInSession = memberTypes[user.id] === 'support'
            const isSupportUser = user.type === 'support'

            if (!isSupportInSession && !isSupportUser) {
                setPermissionDeniedMessage("서명 권한이 없습니다. 관리자만 가능합니다.")
                setPermissionDeniedOpen(true)
                return
            }
        }

        setSigningType(type)
        setPinDialogOpen(true)
    }

    const handleCancelHandover = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                await supabase.from('audit_logs').insert({
                    user_id: user.id,
                    action: 'HANDOVER_CANCEL',
                    target_type: 'SESSION',
                    changes: {
                        cancelled_session: nextSession?.groupName,
                        timestamp: new Date().toISOString()
                    }
                })
            }
        } catch (e) {
            console.error("Failed to log handover cancel:", e)
        }

        // [New] Cleanup drafted worklog if exists and is for next session
        if (nextSession && currentSession) {
            const now = new Date()
            const hour = now.getHours()
            const isDayTime = hour >= 7 && hour < 18

            // Logic: 
            // If currently Day (07-18), we are working Day shift. Next is Night (Today).
            // If currently Night (18-07), we are working Night shift. Next is Day (Today).
            // Usually handover happens near the end of shift.
            // Night->Day Handover is at 07:30 (Day Time? No, 07:30 is > 07). 
            // 07:30 is isDayTime=true. Next is Night?
            // Wait.
            // If it is 07:30. 'isDayTime' is TRUE.
            // If 'isDayTime' is true, Current is Day??
            // NO. If it is 07:30, I am finishing NIGHT shift.
            // THIS is the ambiguity.

            // Let's refine 'isDayTime' based on accurate handover windows.
            // Morning Handover: 06:00 - 09:00. (Night -> Day)
            // Evening Handover: 17:00 - 20:00. (Day -> Night)

            let deleteShiftType = '야간'
            const deleteDateStr = format(now, 'yyyy-MM-dd')

            // If it's Morning (06-09), we are transitioning TO 'Day'. So delete 'Day'.
            if (hour >= 5 && hour < 10) {
                deleteShiftType = '주간'
            }
            // If it's Evening (17-20), we are transitioning TO 'Night'. So delete 'Night'.
            else if (hour >= 16 && hour < 21) {
                deleteShiftType = '야간'
            }
            // For other times, fall back to simple day/night flip of CURRENT time?
            // If I am active in 'Day' shift (14:00), Next is 'Night'.
            else {
                deleteShiftType = isDayTime ? '야간' : '주간'
            }

            const { data } = await supabase
                .from('worklogs')
                .select('id, status, signatures, channel_logs, system_issues')
                .eq('date', deleteDateStr)
                .eq('group_name', nextSession.groupName)
                .eq('type', deleteShiftType)
                .maybeSingle()

            if (data) {
                // Check safety conditions
                const hasSignatures = data.signatures && Object.values(data.signatures).some((v: any) => v !== null)

                // Check if there is any text content
                let hasContent = false

                // Check channel logs for actual text
                if (data.channel_logs) {
                    const logs = data.channel_logs as any
                    for (const key of Object.keys(logs)) {
                        const channelData = logs[key]
                        if (channelData && channelData.posts && channelData.posts.length > 0) {
                            hasContent = true;
                            break;
                        }
                    }
                }

                // Check system issues (if length > 0)
                if (!hasContent && data.system_issues && Array.isArray(data.system_issues) && data.system_issues.length > 0) {
                    hasContent = true
                }

                // We delete if it is In Progress (or Pending/Waiting which is also status=작성중), NO signatures, AND NO content.
                if (data.status === '작성중' && !hasSignatures && !hasContent) {
                    await supabase.from('worklogs').delete().eq('id', data.id)
                    toast.info("작성 중인 대기 업무일지가 삭제되었습니다. (내용 없음)")
                } else if (hasContent) {
                    // console.log("Worklog has content, skipping delete")
                }
            }
        }

        const { setNextSession, setNextUser } = useAuthStore.getState()
        setNextSession(null)
        setNextUser(null)
        window.location.reload()
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            if (id) {
                handleSave(true)
            }
        }, 1000)
        return () => clearTimeout(timer)
    }, [workers])

    const isCurrentContext = currentSession &&
        (selectedTeam === currentSession.groupName || (nextSession && selectedTeam === nextSession.groupName)) &&
        (isToday(selectedDate) || (isYesterday(selectedDate) && shiftType === 'night' && new Date().getHours() < 12))

    return (
        <div className={cn("min-h-screen px-8 py-2 -mt-4 print:bg-white print:p-0 font-sans", activeTab === 'next' ? "bg-amber-50/50 dark:bg-amber-950/30" : "bg-gray-100 dark:bg-background")}>
            <div className="mx-auto max-w-[210mm] print:max-w-none">
                <style type="text/css" media="print">
                    {`
                        @page {
                            size: A4;
                            margin: 0;
                        }
                        body {
                            margin: 0;
                            padding: 0;
                            -webkit-print-color-adjust: exact;
                        }
                    `}
                </style>

                {/* Tabs for Handover Mode - Only show if next session exists AND we are viewing the current session's log */}
                {nextSession && isCurrentContext && (
                    <div className="mb-6 print:hidden">
                        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 h-12">
                                <TabsTrigger value="current" className="text-base">
                                    [현재] {currentSession?.groupName || "현재 근무"}{activeTab === 'next' ? (shiftType === 'day' ? 'N' : 'A') : (shiftType === 'day' ? 'A' : 'N')} (근무 중)
                                </TabsTrigger>
                                <TabsTrigger value="next" className="text-base data-[state=active]:bg-amber-100 data-[state=active]:text-amber-900">
                                    [다음] {nextSession.groupName}{activeTab === 'next' ? (shiftType === 'day' ? 'A' : 'N') : (shiftType === 'day' ? 'N' : 'A')} (근무준비 중)
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
                        {/* 목록으로 버튼 삭제됨 */}

                    </div>
                    <div className="flex gap-2">
                        {/* Save Status Indicator */}
                        <div className="mr-2 text-sm text-gray-500 font-medium flex items-center gap-1">
                            {isSaving ? (
                                <>
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                    저장 중...
                                </>
                            ) : isDirty ? (
                                <span className="text-amber-600">저장되지 않음</span>
                            ) : lastSaved ? (
                                <span className="text-teal-600">
                                    저장됨 ({format(lastSaved, 'HH:mm:ss')})
                                </span>
                            ) : null}
                        </div>

                        {/* Promote Session Button (Visible in both tabs if next session exists AND is current context) */}
                        {nextSession && isCurrentContext && (
                            <>
                                <Button onClick={handleCancelHandover} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                                    근무교대취소
                                </Button>
                                <Button onClick={handlePromoteSession} className="bg-indigo-600 hover:bg-indigo-700">
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    근무교대하기
                                </Button>
                            </>
                        )}



                        {/* 저장 버튼 삭제됨 (자동 저장 적용) */}
                        <Button onClick={handlePrint}>
                            <Printer className="mr-2 h-4 w-4" />
                            인쇄하기
                        </Button>
                    </div>
                </div>

                <PinVerificationDialog
                    open={pinDialogOpen}
                    onOpenChange={setPinDialogOpen}
                    members={(() => {
                        const allMembers = currentSession?.members || []
                        let filteredMembers = []

                        if (signingType === 'operation') {
                            // Only Director
                            filteredMembers = allMembers.filter(m => m.role && m.role.includes('감독'))
                        } else if (['team_leader', 'mcr', 'network'].includes(signingType || '')) {
                            // Only Support (type === 'support')
                            filteredMembers = allMembers.filter(m => memberTypes[m.id] === 'support')
                        } else {
                            filteredMembers = allMembers
                        }

                        // [Fix] If current user represents a valid signer (e.g. Support) but is NOT in the session list,
                        // we must add them so they can select themselves.
                        if (user && user.type === 'support' && ['team_leader', 'mcr', 'network'].includes(signingType || '')) {
                            const isInList = filteredMembers.some(m => m.id === user.id)
                            if (!isInList) {
                                // Add current user to the list
                                filteredMembers.push({
                                    id: user.id,
                                    name: user.name,
                                    role: '관리', // Display as Admin
                                    profile_image_url: (user as any).user_metadata?.avatar_url
                                })
                            }
                        }

                        return filteredMembers
                    })()}
                    defaultSelectedId={
                        signingType === 'operation'
                            ? currentSession?.members.find(m => m.role?.includes('감독'))?.id || user?.id
                            : user?.id
                    }
                    onSuccess={handlePinSuccess}
                    title={pendingAction === 'handover' ? "근무 교대 승인" : "업무일지 결재"}
                    description={pendingAction === 'handover'
                        ? "근무를 종료하고 다음 조에게 인계하시겠습니까? 책임자의 확인이 필요합니다."
                        : "업무일지를 최종 승인하시겠습니까? 서명 후에는 수정이 제한될 수 있습니다."}
                />

                {/* Permission Denied Dialog */}
                <Dialog open={permissionDeniedOpen} onOpenChange={setPermissionDeniedOpen}>
                    <DialogContent className="sm:max-w-[400px]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-amber-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-circle"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                                권한 없음
                            </DialogTitle>
                        </DialogHeader>
                        <div className="py-4 text-center font-medium text-gray-700">
                            {permissionDeniedMessage}
                        </div>
                        <DialogFooter>
                            <Button onClick={() => setPermissionDeniedOpen(false)} className="w-full sm:w-auto">
                                확인
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* A4 Page Container */}
                <div className="bg-white text-black px-[12mm] pt-[18mm] pb-[5mm] shadow-lg dark:shadow-2xl dark:shadow-black/50 print:shadow-none print:m-0 w-[210mm] min-h-[297mm] print:w-[210mm] print:h-[297mm] mx-auto relative box-border flex flex-col print:overflow-hidden print:absolute print:top-0 print:left-0">

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
                                <div className="text-base font-bold">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" className={cn("text-base font-bold hover:bg-transparent p-0 h-auto", !id && "cursor-pointer hover:underline")}>
                                                {format(selectedDate, "yyyy년 M월 d일 EEEE", { locale: ko })}
                                            </Button>
                                        </PopoverTrigger>
                                        {!id && (
                                            <PopoverContent className="w-auto p-0" align="center">
                                                <Calendar
                                                    mode="single"
                                                    selected={selectedDate}
                                                    onSelect={(date) => date && setSelectedDate(date)}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        )}
                                    </Popover>
                                </div>
                            </div>

                            {/* Approval Box */}
                            <div className="flex border border-black text-center text-xs">
                                <div className="flex flex-col w-[70px] border-r border-black">
                                    <div className="bg-gray-100 py-0.5 font-bold border-b border-black">운 행</div>
                                    <div
                                        onClick={() => handleGridSign('operation')}
                                        className="h-10 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 group leading-none"
                                    >
                                        {(() => {
                                            const sig = worklogs.find(w => String(w.id) === id)?.signatures?.operation
                                            if (sig) {
                                                const [name, time] = sig.split('|')
                                                return (
                                                    <>
                                                        <span className="text-xs font-bold truncate max-w-full px-0.5">{name}</span>
                                                        <span className="text-[10px] text-gray-600 tracking-tighter scale-y-90 mt-[1px]">{time?.split(' ')[1] ? `${time.split(' ')[0]} ${time.split(' ')[1]}` : time}</span>
                                                    </>
                                                )
                                            }
                                            return <span className="opacity-0 group-hover:opacity-20 text-xs text-gray-400 font-bold">서명</span>
                                        })()}
                                    </div>
                                    <div className="bg-gray-100 py-0.5 font-bold border-t border-b border-black">MCR</div>
                                    <div
                                        onClick={() => handleGridSign('mcr')}
                                        className="h-10 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 group leading-none"
                                    >
                                        {(() => {
                                            const sig = worklogs.find(w => String(w.id) === id)?.signatures?.mcr
                                            if (sig) {
                                                const [name, time] = sig.split('|')
                                                return (
                                                    <>
                                                        <span className="text-xs font-bold truncate max-w-full px-0.5">{name}</span>
                                                        <span className="text-[10px] text-gray-600 tracking-tighter scale-y-90 mt-[1px]">{time?.split(' ')[1] ? `${time.split(' ')[0]} ${time.split(' ')[1]}` : time}</span>
                                                    </>
                                                )
                                            }
                                            return <span className="opacity-0 group-hover:opacity-20 text-xs text-gray-400 font-bold">서명</span>
                                        })()}
                                    </div>
                                </div>
                                <div className="flex flex-col w-[70px]">
                                    <div className="bg-gray-100 py-0.5 font-bold border-b border-black">팀 장</div>
                                    <div
                                        onClick={() => handleGridSign('team_leader')}
                                        className="h-10 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 group leading-none"
                                    >
                                        {(() => {
                                            const sig = worklogs.find(w => String(w.id) === id)?.signatures?.team_leader
                                            if (sig) {
                                                const [name, time] = sig.split('|')
                                                return (
                                                    <>
                                                        <span className="text-xs font-bold truncate max-w-full px-0.5">{name}</span>
                                                        <span className="text-[10px] text-gray-600 tracking-tighter scale-y-90 mt-[1px]">{time?.split(' ')[1] ? `${time.split(' ')[0]} ${time.split(' ')[1]}` : time}</span>
                                                    </>
                                                )
                                            }
                                            return <span className="opacity-0 group-hover:opacity-20 text-xs text-gray-400 font-bold">서명</span>
                                        })()}
                                    </div>
                                    <div className="bg-gray-100 py-0.5 font-bold border-t border-b border-black">Network</div>
                                    <div
                                        onClick={() => handleGridSign('network')}
                                        className="h-10 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 group leading-none"
                                    >
                                        {(() => {
                                            const sig = worklogs.find(w => String(w.id) === id)?.signatures?.network
                                            if (sig) {
                                                const [name, time] = sig.split('|')
                                                return (
                                                    <>
                                                        <span className="text-xs font-bold truncate max-w-full px-0.5">{name}</span>
                                                        <span className="text-[10px] text-gray-600 tracking-tighter scale-y-90 mt-[1px]">{time?.split(' ')[1] ? `${time.split(' ')[0]} ${time.split(' ')[1]}` : time}</span>
                                                    </>
                                                )
                                            }
                                            return <span className="opacity-0 group-hover:opacity-20 text-xs text-gray-400 font-bold">서명</span>
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Shift Table */}
                    <div className="mb-2 w-full border border-black">
                        <div className="flex bg-gray-100 text-center text-sm font-bold border-b border-black">
                            <div
                                className="w-[180px] border-r border-black py-1 cursor-pointer hover:bg-gray-200 transition-colors select-none"
                                onClick={() => setShiftType(shiftType === 'day' ? 'night' : 'day')}
                                title="클릭하여 주간/야간 변경"
                            >
                                {shiftType === 'day' ? '주간 근무시간' : '야간 근무시간'}
                            </div>
                            <div className="flex-1 border-r border-black py-1">감 독</div>
                            <div className="flex-1 border-r border-black py-1">부 감 독</div>
                            <div className="flex-1 py-1">영 상</div>
                        </div>
                        <div className="flex text-center text-sm min-h-[2rem]">
                            <div className="w-[180px] border-r border-black flex items-center justify-center font-handwriting text-base p-1">
                                <input
                                    type="text"
                                    className="w-full text-center bg-transparent outline-none font-handwriting"
                                    value={timeRange}
                                    onChange={(e) => setTimeRange(e.target.value)}
                                    placeholder={shiftType === 'day' ? '07:30 ~ 19:00' : '18:30 ~ 08:00'}
                                />
                            </div>
                            {/* Director */}
                            <div className="flex-1 border-r border-black p-1 flex flex-col justify-center gap-1 relative group">
                                {workers.director.length > 1 && (
                                    <div
                                        className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-pointer text-gray-400 hover:text-red-500 text-sm print:hidden"
                                        onClick={() => setWorkers({ ...workers, director: workers.director.slice(0, -1) })}
                                    >
                                        −
                                    </div>
                                )}
                                <div className={`flex ${workers.director.length === 2 ? 'flex-row justify-center gap-2 px-4' : 'flex-col'}`}>
                                    {workers.director.map((name, index) => (
                                        <Input
                                            key={index}
                                            className="h-6 text-center border-none shadow-none focus-visible:ring-0 p-0 font-handwriting text-lg bg-white dark:bg-white text-black w-full"
                                            value={name}
                                            onChange={(e) => {
                                                const newWorkers = [...workers.director];
                                                newWorkers[index] = e.target.value;
                                                setWorkers({ ...workers, director: newWorkers });
                                            }}
                                            placeholder="이름"
                                        />
                                    ))}
                                </div>
                                {workers.director.length < 4 && (
                                    <div
                                        className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-pointer text-gray-400 hover:text-black print:hidden"
                                        onClick={() => setWorkers({ ...workers, director: [...workers.director, ''] })}
                                    >
                                        +
                                    </div>
                                )}
                            </div>
                            {/* Assistant Director */}
                            <div className="flex-1 border-r border-black p-1 flex flex-col justify-center gap-1 relative group">
                                {workers.assistant.length > 1 && (
                                    <div
                                        className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-pointer text-gray-400 hover:text-red-500 text-sm print:hidden"
                                        onClick={() => setWorkers({ ...workers, assistant: workers.assistant.slice(0, -1) })}
                                    >
                                        −
                                    </div>
                                )}
                                <div className={`flex ${workers.assistant.length === 2 ? 'flex-row justify-center gap-2 px-4' : 'flex-col'}`}>
                                    {workers.assistant.map((name, index) => (
                                        <Input
                                            key={index}
                                            className="h-6 text-center border-none shadow-none focus-visible:ring-0 p-0 font-handwriting text-lg bg-white dark:bg-white text-black w-full"
                                            value={name}
                                            onChange={(e) => {
                                                const newWorkers = [...workers.assistant];
                                                newWorkers[index] = e.target.value;
                                                setWorkers({ ...workers, assistant: newWorkers });
                                            }}
                                            placeholder="이름"
                                        />
                                    ))}
                                </div>
                                {workers.assistant.length < 4 && (
                                    <div
                                        className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-pointer text-gray-400 hover:text-black print:hidden"
                                        onClick={() => setWorkers({ ...workers, assistant: [...workers.assistant, ''] })}
                                    >
                                        +
                                    </div>
                                )}
                            </div>
                            {/* Video */}
                            <div className="flex-1 p-1 flex flex-col justify-center gap-1 relative group">
                                {workers.video.length > 1 && (
                                    <div
                                        className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-pointer text-gray-400 hover:text-red-500 text-sm print:hidden"
                                        onClick={() => setWorkers({ ...workers, video: workers.video.slice(0, -1) })}
                                    >
                                        −
                                    </div>
                                )}
                                <div className={`flex ${workers.video.length === 2 ? 'flex-row justify-center gap-2 px-4' : 'flex-col'}`}>
                                    {workers.video.map((name, index) => (
                                        <Input
                                            key={index}
                                            className="h-6 text-center border-none shadow-none focus-visible:ring-0 p-0 font-handwriting text-lg bg-white dark:bg-white text-black w-full"
                                            value={name}
                                            onChange={(e) => {
                                                const newWorkers = [...workers.video];
                                                newWorkers[index] = e.target.value;
                                                setWorkers({ ...workers, video: newWorkers });
                                            }}
                                            placeholder="이름"
                                        />
                                    ))}
                                </div>
                                {workers.video.length < 4 && (
                                    <div
                                        className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-pointer text-gray-400 hover:text-black print:hidden"
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
                    <div className="border border-black border-b-0 flex flex-col">

                        {/* MBC SPORTS+ */}
                        <div className="border-b border-black">
                            <ChannelRow
                                name="MBC SPORTS+"
                                worklogId={id}
                                posts={channelLogs["MBC SPORTS+"]?.posts || []}
                                onPostsChange={(posts) => setChannelLogs(prev => ({ ...prev, "MBC SPORTS+": { ...prev["MBC SPORTS+"], posts, timecodes: prev["MBC SPORTS+"]?.timecodes || {} } }))}
                                timecodeEntries={channelLogs["MBC SPORTS+"]?.timecodes || {}}
                                onTimecodeUpdate={(key, val) => handleTimecodeUpdate("MBC SPORTS+", key, val)}
                                onNewPost={() => handleNewPostRequest("MBC SPORTS+", "channel-operation", "MBC SPORTS+", "MBC SPORTS+")}
                            />
                        </div>

                        {/* MBC Every1 */}
                        <div className="border-b border-black">
                            <ChannelRow
                                name="MBC Every1"
                                worklogId={id}
                                posts={channelLogs["MBC Every1"]?.posts || []}
                                onPostsChange={(posts) => setChannelLogs(prev => ({ ...prev, "MBC Every1": { ...prev["MBC Every1"], posts, timecodes: prev["MBC Every1"]?.timecodes || {} } }))}
                                timecodeEntries={channelLogs["MBC Every1"]?.timecodes || {}}
                                onTimecodeUpdate={(key, val) => handleTimecodeUpdate("MBC Every1", key, val)}
                                onNewPost={() => handleNewPostRequest("MBC Every1", "channel-operation", "MBC Every1", "MBC Every1")}
                            />
                        </div>

                        {/* MBC DRAMA */}
                        <div className="border-b border-black">
                            <ChannelRow
                                name="MBC DRAMA"
                                worklogId={id}
                                posts={channelLogs["MBC DRAMA"]?.posts || []}
                                onPostsChange={(posts) => setChannelLogs(prev => ({ ...prev, "MBC DRAMA": { ...prev["MBC DRAMA"], posts, timecodes: prev["MBC DRAMA"]?.timecodes || {} } }))}
                                timecodeEntries={channelLogs["MBC DRAMA"]?.timecodes || {}}
                                onTimecodeUpdate={(key, val) => handleTimecodeUpdate("MBC DRAMA", key, val)}
                                onNewPost={() => handleNewPostRequest("MBC DRAMA", "channel-operation", "MBC DRAMA", "MBC DRAMA")}
                            />
                        </div>

                        {/* MBC M */}
                        <div className="border-b border-black">
                            <ChannelRow
                                name="MBC M"
                                worklogId={id}
                                posts={channelLogs["MBC M"]?.posts || []}
                                onPostsChange={(posts) => setChannelLogs(prev => ({ ...prev, "MBC M": { ...prev["MBC M"], posts, timecodes: prev["MBC M"]?.timecodes || {} } }))}
                                timecodeEntries={channelLogs["MBC M"]?.timecodes || {}}
                                onTimecodeUpdate={(key, val) => handleTimecodeUpdate("MBC M", key, val)}
                                onNewPost={() => handleNewPostRequest("MBC M", "channel-operation", "MBC M", "MBC M")}
                            />
                        </div>

                        {/* MBC ON */}
                        <div className="border-b border-black">
                            <ChannelRow
                                name="MBC ON"
                                worklogId={id}
                                posts={channelLogs["MBC ON"]?.posts || []}
                                onPostsChange={(posts) => setChannelLogs(prev => ({ ...prev, "MBC ON": { ...prev["MBC ON"], posts, timecodes: prev["MBC ON"]?.timecodes || {} } }))}
                                timecodeEntries={channelLogs["MBC ON"]?.timecodes || {}}
                                onTimecodeUpdate={(key, val) => handleTimecodeUpdate("MBC ON", key, val)}
                                onNewPost={() => handleNewPostRequest("MBC ON", "channel-operation", "MBC ON", "MBC ON")}
                            />
                        </div>
                    </div>

                    {/* System Issues Section */}
                    <div className="mb-0 border border-black bg-gray-300 py-0.5 text-center font-bold border-b-0 text-base tracking-[0.3em]">
                        시스템 및 기타 특이사항
                    </div>
                    <div className="border border-black min-h-[6rem] p-1">
                        <SystemIssuesList
                            issues={systemIssues}
                            onIssuesChange={setSystemIssues}
                            onNewPost={() => handleNewPostRequest("system-issues", "system-issue", "System Issue")}
                        />
                    </div>

                </div>
            </div>
            <AlertDialog open={signatureCancelOpen} onOpenChange={setSignatureCancelOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>서명 삭제</AlertDialogTitle>
                        <AlertDialogDescription>
                            이미 완료된 서명을 삭제하시겠습니까?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setSignatureCancelOpen(false)}>취소</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemoveSignature} className="bg-red-600 hover:bg-red-700">
                            삭제
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    )
}
