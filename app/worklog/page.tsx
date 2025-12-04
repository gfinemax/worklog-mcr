"use client"

import { useState, useMemo, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, Sparkles, CalendarIcon, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useWorklogStore, Worklog } from "@/store/worklog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { FolderTabsList, FolderTabsTrigger } from "@/components/ui/folder-tabs"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { useWorklogTabStore } from "@/store/worklog-tab-store"
import { WorklogDetail } from "@/components/worklog/worklog-detail"
import { toast } from "sonner"
import { useAuthStore } from "@/store/auth"

type SortConfig = {
  key: keyof Worklog
  direction: 'asc' | 'desc'
} | null

function WorklogListView() {
  const router = useRouter()
  const worklogs = useWorklogStore((state) => state.worklogs)
  const updateWorklog = useWorklogStore((state) => state.updateWorklog)
  const fetchWorklogs = useWorklogStore((state) => state.fetchWorklogs)
  const { addTab } = useWorklogTabStore()
  const [sortConfig, setSortConfig] = useState<SortConfig>(null)

  useEffect(() => {
    fetchWorklogs()
  }, [fetchWorklogs])
  const [summaryDialog, setSummaryDialog] = useState<{
    open: boolean
    worklog: Worklog | null
    loading: boolean
  }>({
    open: false,
    worklog: null,
    loading: false
  })

  const handleImportantToggle = (id: string | number, checked: boolean) => {
    updateWorklog(id, { isImportant: checked })
  }

  const generateSummary = async (worklog: Worklog): Promise<string> => {
    try {
      const response = await fetch('/api/ai-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ worklog }),
      })

      if (!response.ok) {
        throw new Error('AI 요약 생성 실패')
      }

      const { summary } = await response.json()
      return summary
    } catch (error) {
      console.error('Summary generation error:', error)
      return '요약을 생성할 수 없습니다. 나중에 다시 시도해주세요.'
    }
  }

  const handleSummaryClick = async (worklog: Worklog) => {
    setSummaryDialog({ open: true, worklog, loading: !worklog.aiSummary })

    if (!worklog.aiSummary) {
      const summary = await generateSummary(worklog)
      updateWorklog(worklog.id, { aiSummary: summary })
      setSummaryDialog(prev => ({
        ...prev,
        loading: false,
        worklog: prev.worklog ? { ...prev.worklog, aiSummary: summary } : null
      }))
    }
  }

  const isWorkingNow = (log: Worklog) => {
    const now = new Date()
    const [year, month, day] = log.date.split('-').map(Number)

    let start = new Date(year, month - 1, day)
    let end = new Date(year, month - 1, day)

    if (log.type === '주간') {
      start.setHours(7, 30, 0, 0)
      end.setHours(18, 30, 0, 0)
    } else {
      start.setHours(18, 30, 0, 0)
      end.setDate(end.getDate() + 1)
      end.setHours(8, 0, 0, 0)
    }

    return now >= start && now <= end
  }

  const [teamFilter, setTeamFilter] = useState<string>("all")
  const [shiftFilter, setShiftFilter] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateQuery, setDateQuery] = useState("")

  const { currentSession } = useAuthStore()

  const filteredWorklogs = useMemo(() => {
    return worklogs.filter(log => {
      // Filter out "Current Active Worklog" (Today + My Group + Current Shift)
      // This logic mirrors isWorkingNow but is stricter about "My Group" if available
      const isToday = log.date === format(new Date(), 'yyyy-MM-dd')
      const isMyGroup = currentSession ? log.groupName === currentSession.groupName : true // If no session, can't filter by group strictly, but usually session exists

      // Determine current shift type based on time
      const now = new Date()
      const hour = now.getHours()
      const isDayShift = hour >= 7 && hour < 18 // Approx 07:00 - 18:00
      const currentShiftType = isDayShift ? '주간' : '야간'

      // We want to SHOW the current worklog in the list now, so we remove the hiding logic.
      // But we still want to filter by team/shift/search if selected.

      // Team Filter
      if (teamFilter !== "all" && log.groupName !== teamFilter) return false
      // Shift Filter
      if (shiftFilter !== "all" && (shiftFilter === 'day' ? log.type !== '주간' : log.type !== '야간')) return false

      // Date Filter
      if (dateQuery && !log.date.includes(dateQuery)) return false

      // Search Filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase().trim()
        return (
          log.date.includes(query) ||
          (log.groupName && log.groupName.toLowerCase().includes(query)) ||
          (log.type && log.type.includes(query)) ||
          log.workers.director.some(w => w.toLowerCase().includes(query)) ||
          log.workers.assistant.some(w => w.toLowerCase().includes(query)) ||
          log.workers.video.some(w => w.toLowerCase().includes(query))
        )
      }
      return true
    })
  }, [worklogs, teamFilter, shiftFilter, searchQuery, dateQuery, currentSession])

  const sortedWorklogs = useMemo(() => {
    let sortableWorklogs = [...filteredWorklogs]
    if (sortConfig !== null) {
      sortableWorklogs.sort((a, b) => {
        // Custom sort for Date to include Shift Type
        if (sortConfig.key === 'date') {
          const dateCompare = a.date.localeCompare(b.date)
          if (dateCompare !== 0) {
            return sortConfig.direction === 'asc' ? dateCompare : -dateCompare
          }
          // If dates are equal, sort by Shift Type (Day -> Night)
          // Day (주간) = 0, Night (야간) = 1
          const getShiftValue = (type: string) => type === '주간' ? 0 : 1
          const aShift = getShiftValue(a.type)
          const bShift = getShiftValue(b.type)

          if (aShift < bShift) return sortConfig.direction === 'asc' ? -1 : 1
          if (aShift > bShift) return sortConfig.direction === 'asc' ? 1 : -1
          return 0
        }

        let aValue: any = a[sortConfig.key]
        let bValue: any = b[sortConfig.key]

        // Special handling for workers object sorting (sort by first director)
        if (sortConfig.key === 'workers') {
          aValue = a.workers.director[0] || ''
          bValue = b.workers.director[0] || ''
        }

        // Special handling for status sorting (include '근무중')
        if (sortConfig.key === 'status') {
          const getEffectiveStatus = (log: Worklog) => {
            if (isWorkingNow(log) && log.status === '작성중') return '근무중'
            return log.status
          }
          aValue = getEffectiveStatus(a)
          bValue = getEffectiveStatus(b)
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }
    return sortableWorklogs
  }, [filteredWorklogs, sortConfig])

  const statusSummary = useMemo(() => {
    const total = filteredWorklogs.length
    const active = filteredWorklogs.filter(log => log.status === '작성중').length
    const signed = filteredWorklogs.filter(log => log.status === '서명완료').length
    return { total, active, signed }
  }, [filteredWorklogs])

  const requestSort = (key: keyof Worklog) => {
    let direction: 'asc' | 'desc' = 'asc'
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc'
    }
    setSortConfig({ key, direction })
  }

  const getSortIcon = (key: keyof Worklog) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="h-4 w-4" />
    ) : (
      <ArrowDown className="h-4 w-4" />
    )
  }

  const handleRowClick = (log: Worklog) => {
    // Check if this is today's worklog (simple date check for now, can be more specific)
    const isTodayLog = isWorkingNow(log) || log.date === format(new Date(), 'yyyy-MM-dd')

    if (isTodayLog) {
      router.push('/worklog?mode=today')
      return
    }

    addTab({
      id: String(log.id),
      title: `${log.date} ${log.groupName}`,
      date: log.date,
      type: log.type
    })

    // Explicitly push URL to navigate
    router.push(`/worklog?id=${log.id}`)
  }



  return (
    <div className="space-y-6">


      <Card className="rounded-tl-none shadow-none border-t-0">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left Side: Filters */}
            <div className="flex flex-1 items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="검색..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[200px] justify-start text-left font-normal",
                        !dateQuery && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateQuery ? dateQuery : "날짜 선택"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateQuery ? new Date(dateQuery) : undefined}
                      onSelect={(date) => setDateQuery(date ? format(date, "yyyy-MM-dd") : "")}
                      initialFocus
                    />
                    <div className="p-3 border-t border-border">
                      <Button variant="ghost" className="w-full" onClick={() => setDateQuery("")}>
                        전체
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Right Side: Summary */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground whitespace-nowrap">
              <div className="flex items-center gap-2">
                <span>전체 <span className="font-bold text-foreground">{statusSummary.total}</span></span>
                <span className="text-gray-300">|</span>
                <span>작성중 <span className="font-bold text-amber-600">{statusSummary.active}</span></span>
                <span className="text-gray-300">|</span>
                <span>완료 <span className="font-bold text-teal-600">{statusSummary.signed}</span></span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">
                  <Button variant="ghost" onClick={() => requestSort('date')} className="group h-8 p-0 font-bold hover:bg-transparent hover:text-foreground w-full justify-center">
                    <span className="relative flex items-center">
                      날짜
                      <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2">
                        {getSortIcon('date')}
                      </span>
                    </span>
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button variant="ghost" onClick={() => requestSort('groupName')} className="group h-8 p-0 font-bold hover:bg-transparent hover:text-foreground w-full justify-center">
                    <span className="relative flex items-center">
                      근무조
                      <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2">
                        {getSortIcon('groupName')}
                      </span>
                    </span>
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button variant="ghost" onClick={() => requestSort('type')} className="group h-8 p-0 font-bold hover:bg-transparent hover:text-foreground w-full justify-center">
                    <span className="relative flex items-center">
                      근무 형태
                      <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2">
                        {getSortIcon('type')}
                      </span>
                    </span>
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button variant="ghost" onClick={() => requestSort('workers')} className="group h-8 p-0 font-bold hover:bg-transparent hover:text-foreground w-full justify-center">
                    <span className="relative flex items-center">
                      근무자
                      <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2">
                        {getSortIcon('workers')}
                      </span>
                    </span>
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button variant="ghost" onClick={() => requestSort('status')} className="group h-8 p-0 font-bold hover:bg-transparent hover:text-foreground w-full justify-center">
                    <span className="relative flex items-center">
                      상태
                      <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2">
                        {getSortIcon('status')}
                      </span>
                    </span>
                  </Button>
                </TableHead>
                <TableHead className="text-center">
                  <Button variant="ghost" onClick={() => requestSort('isImportant')} className="group h-8 p-0 font-bold hover:bg-transparent hover:text-foreground w-full justify-center">
                    <span className="relative flex items-center">
                      중요
                      <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2">
                        {getSortIcon('isImportant')}
                      </span>
                    </span>
                  </Button>
                </TableHead>
                <TableHead className="text-center">결제</TableHead>
                <TableHead className="text-center">AI요약</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedWorklogs.map((log) => (
                <TableRow
                  key={log.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleRowClick(log)}
                >
                  <TableCell className="font-medium text-center">{log.date}</TableCell>
                  <TableCell className="text-center">{log.groupName}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{log.type}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {[...log.workers.director, ...log.workers.assistant, ...log.workers.video]
                      .filter(Boolean)
                      .join(", ")}
                  </TableCell>
                  <TableCell className="text-center">
                    {(() => {
                      const isWorking = isWorkingNow(log)

                      // Calculate work end time to determine if work has ended
                      const [year, month, day] = log.date.split('-').map(Number)
                      let end = new Date(year, month - 1, day)
                      if (log.type === '주간') {
                        end.setHours(18, 30, 0, 0)
                      } else {
                        end.setDate(end.getDate() + 1)
                        end.setHours(8, 0, 0, 0)
                      }
                      const isWorkEnded = new Date() > end

                      let displayStatus: string = log.status
                      if (log.status === '작성중') {
                        if (isWorking) {
                          displayStatus = '근무중'
                        } else if (isWorkEnded) {
                          displayStatus = '결제중'
                        }
                      }

                      return (
                        <Badge
                          variant={
                            log.status === "서명완료" ? "secondary" :
                              log.status === "근무종료" ? "destructive" :
                                "default"
                          }
                          className={
                            log.status === "근무종료" ? "bg-amber-500 hover:bg-amber-600" :
                              displayStatus === "근무중" ? "bg-green-600 hover:bg-green-700" :
                                displayStatus === "결제중" ? "bg-orange-500 hover:bg-orange-600" :
                                  ""
                          }
                        >
                          {displayStatus}
                        </Badge>
                      )
                    })()}
                  </TableCell>
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-center">
                      <Checkbox
                        checked={log.isImportant}
                        onCheckedChange={(checked) => handleImportantToggle(log.id, checked as boolean)}
                        className="border border-gray-400 data-[state=checked]:border-primary"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-sm text-muted-foreground">{log.signature}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSummaryClick(log)}
                        className={log.aiSummary ? "opacity-100" : "opacity-80 grayscale hover:opacity-100 hover:grayscale-0 transition-all"}
                      >
                        <span className="text-lg">✨</span>
                        <span className="sr-only">AI 요약</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* AI Summary Dialog */}
      <Dialog open={summaryDialog.open} onOpenChange={(open) => setSummaryDialog({ open, worklog: null, loading: false })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI 업무일지 요약
            </DialogTitle>
          </DialogHeader>
          {summaryDialog.worklog && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="outline">{summaryDialog.worklog.date}</Badge>
                <Badge variant="outline">{summaryDialog.worklog.groupName}</Badge>
                <Badge variant="outline">{summaryDialog.worklog.type}</Badge>
              </div>

              <div className="p-4 bg-muted rounded-lg min-h-[200px]">
                {summaryDialog.loading ? (
                  <div className="flex items-center justify-center h-[200px]">
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <p className="text-sm text-muted-foreground">AI가 요약을 생성하는 중...</p>
                    </div>
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap text-sm font-sans">
                    {summaryDialog.worklog.aiSummary || "요약을 생성할 수 없습니다."}
                  </pre>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="sm:justify-between">
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={async () => {
                  if (!summaryDialog.worklog) return
                  setSummaryDialog(prev => ({ ...prev, loading: true }))
                  try {
                    const summary = await generateSummary(summaryDialog.worklog)
                    await updateWorklog(summaryDialog.worklog.id, { aiSummary: summary })
                    setSummaryDialog(prev => ({
                      ...prev,
                      loading: false,
                      worklog: prev.worklog ? { ...prev.worklog, aiSummary: summary } : null
                    }))
                  } catch (error) {
                    console.error(error)
                    setSummaryDialog(prev => ({ ...prev, loading: false }))
                  }
                }}
                disabled={summaryDialog.loading}
              >
                {summaryDialog.loading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-current"></div>
                    생성 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    재요약
                  </>
                )}
              </Button>
            </div>
            <Button variant="outline" onClick={() => setSummaryDialog({ open: false, worklog: null, loading: false })}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div >
  )
}

function WorkLogPageContent() {
  const { tabs, activeTab, setActiveTab, removeTab, addTab } = useWorklogTabStore()
  const searchParams = useSearchParams()
  const router = useRouter()
  const worklogs = useWorklogStore((state) => state.worklogs)
  const fetchWorklogs = useWorklogStore((state) => state.fetchWorklogs)
  const mode = searchParams.get('mode')
  const { currentSession } = useAuthStore()

  // Effect 1: Handle URL -> ActiveTab Sync (Routing)
  // This should NOT depend on worklogs to avoid race conditions
  useEffect(() => {
    const id = searchParams.get('id')

    if (mode === 'today') return

    if (id) {
      // Check if tab already exists
      const existingTab = tabs.find(t => t.id === id)
      if (existingTab) {
        if (activeTab !== id) {
          setActiveTab(id)
        }
      }
      // If tab doesn't exist, we wait for Effect 2 to add it
    } else {
      // No ID, should be on list
      if (activeTab !== 'list') {
        setActiveTab('list')
      }
    }
  }, [searchParams, mode, tabs, activeTab, setActiveTab])

  // Effect 2: Handle Data -> Tab Creation/Update (Hydration)
  useEffect(() => {
    const id = searchParams.get('id')
    if (!id || mode === 'today') return

    const existingTab = tabs.find(t => t.id === id)
    const log = worklogs.find(w => String(w.id) === id)

    if (!existingTab) {
      if (id === 'new') {
        addTab({
          id: 'new',
          title: '새 업무일지',
          date: format(new Date(), 'yyyy-MM-dd'),
          type: 'new'
        })
      } else {
        if (log) {
          addTab({
            id: String(log.id),
            title: `${log.date} ${log.groupName}`,
            date: log.date,
            type: log.type
          })
        } else {
          // If not found in store yet, we can add a temporary tab
          addTab({
            id: id,
            title: `로딩중...`, // Better placeholder than UUID
            date: '',
            type: ''
          })
        }
      }
    } else {
      // Tab exists, check if we need to update title (e.g. from "Loading..." to actual data)
      if (log) {
        const expectedTitle = `${log.date} ${log.groupName}`

        const needsUpdate =
          existingTab.title !== expectedTitle ||
          existingTab.date !== log.date ||
          existingTab.type !== log.type

        if (needsUpdate) {
          // Use getState() to avoid dependency cycle if possible, though we are in effect
          useWorklogTabStore.getState().updateTab(id, {
            title: expectedTitle,
            date: log.date,
            type: log.type
          })
        }
      }
    }
  }, [searchParams, worklogs, tabs, addTab, mode])

  // Effect 3: Clean up Today's log from tabs
  useEffect(() => {
    if (currentSession) {
      const today = format(new Date(), 'yyyy-MM-dd')
      const now = new Date()
      const hour = now.getHours()
      const isDayShift = hour >= 7 && hour < 18
      const currentShiftType = isDayShift ? '주간' : '야간'

      const todayLog = worklogs.find(w =>
        w.date === today &&
        w.groupName === currentSession.groupName &&
        w.type === currentShiftType
      )

      if (todayLog) {
        const tabToRemove = tabs.find(t => t.id === String(todayLog.id))
        if (tabToRemove) {
          removeTab(tabToRemove.id)
          if (activeTab === tabToRemove.id) {
            setActiveTab('list')
          }
        }
      }
    }
  }, [worklogs, currentSession, tabs, removeTab, activeTab, setActiveTab])

  const handleCloseTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    removeTab(id)
  }

  const [todayWorklogId, setTodayWorklogId] = useState<string | null>(null)

  useEffect(() => {
    if (mode === 'today') {
      // Calculate today's worklog ID to pass to detail
      const today = format(new Date(), 'yyyy-MM-dd')
      const now = new Date()
      const hour = now.getHours()
      const isDayShift = hour >= 7 && hour < 18
      const defaultShiftType = isDayShift ? '주간' : '야간'

      // Check for overrides from URL (e.g. Next Shift tab)
      const paramTeam = searchParams.get('team')
      const paramType = searchParams.get('type') // 'day' | 'night'

      const targetGroup = paramTeam || (currentSession ? currentSession.groupName : null)
      const targetShift = paramType ? (paramType === 'day' ? '주간' : '야간') : defaultShiftType

      // Find matching worklog
      const todayLog = worklogs.find(w =>
        w.date === today &&
        (targetGroup ? w.groupName === targetGroup : true) &&
        w.type === targetShift
      )

      setTodayWorklogId(todayLog ? String(todayLog.id) : 'new')
    }
  }, [mode, worklogs, currentSession, searchParams])

  if (mode === 'today') {
    if (todayWorklogId === null) {
      return (
        <MainLayout>
          <div className="p-8 flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </MainLayout>
      )
    }

    return (
      <MainLayout>
        <div className="p-8">
          <WorklogDetail worklogId={todayWorklogId} />
        </div>
      </MainLayout>
    )
  }

  const handleTabChange = (value: string) => {
    if (value === 'list') {
      router.push('/worklog', { scroll: false })
    } else {
      router.push(`/worklog?id=${value}`, { scroll: false })
    }
  }

  return (
    <MainLayout>
      <div className="px-8 pt-2 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">업무일지 저장소</h1>
            <p className="text-muted-foreground">주조정실 업무일지 목록입니다.</p>
          </div>
          <Button onClick={() => router.push('/worklog?mode=today')}>
            <Plus className="mr-2 h-4 w-4" />새 일지 작성
          </Button>
        </div>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="print:hidden relative z-10">
            <FolderTabsList>
              <FolderTabsTrigger value="list">
                업무일지 목록
              </FolderTabsTrigger>
              {tabs.map((tab) => (
                <FolderTabsTrigger key={tab.id} value={tab.id}>
                  <div className="flex items-center gap-2">
                    <span>{tab.title}</span>
                    <div
                      role="button"
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleCloseTab(e, tab.id)
                      }}
                      className="rounded-full p-0.5 hover:bg-slate-300/50 text-slate-500 hover:text-slate-700 transition-colors z-50"
                    >
                      <X className="h-3 w-3" />
                    </div>
                  </div>
                </FolderTabsTrigger>
              ))}
            </FolderTabsList>
          </div>

          <TabsContent value="list" className="-mt-[2px] relative z-0">
            <WorklogListView />
          </TabsContent>

          {tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-6">
              <WorklogDetail worklogId={tab.id === 'new' ? null : tab.id} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </MainLayout>
  )
}

export default function WorkLogPage() {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      <WorkLogPageContent />
    </Suspense>
  )
}
