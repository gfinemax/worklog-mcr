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
import { Plus, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, Sparkles, CalendarIcon, X, AlertCircle, CheckCircle2, Upload, LayoutList, Download, MoreVertical, Trash2, Edit2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useWorklogStore, Worklog } from "@/store/worklog"
import { supabase } from "@/lib/supabase"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ko } from "date-fns/locale"
import { FolderTabsList, FolderTabsTrigger } from "@/components/ui/folder-tabs"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { useWorklogTabStore } from "@/store/worklog-tab-store"
import { WorklogDetail } from "@/components/worklog/worklog-detail"
import { toast } from "sonner"
import { useAuthStore } from "@/store/auth"
import { shiftService } from "@/lib/shift-rotation"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { exportWorklogsToExcel } from "@/lib/excel-export"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { SimplePagination, usePagination } from "@/components/ui/simple-pagination"

type SortConfig = {
  key: keyof Worklog
  direction: 'asc' | 'desc'
} | null

function WorklogListView() {
  const router = useRouter()
  const worklogs = useWorklogStore((state) => state.worklogs)
  const updateWorklog = useWorklogStore((state) => state.updateWorklog)
  const deleteWorklog = useWorklogStore((state) => state.deleteWorklog)
  const fetchWorklogs = useWorklogStore((state) => state.fetchWorklogs)
  const { addTab, closeAllTabs } = useWorklogTabStore()
  const [sortConfig, setSortConfig] = useState<SortConfig>(null)

  const [groupMembers, setGroupMembers] = useState<any[]>([])

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 15

  useEffect(() => {
    const fetchGroupMembers = async () => {
      const { data } = await supabase
        .from('group_members')
        .select(`
          *,
          groups (name),
          users (name)
        `)
      if (data) setGroupMembers(data)
    }
    fetchGroupMembers()
  }, [])

  const getWorkerChanges = (log: Worklog) => {
    if (!groupMembers.length) return null

    const groupName = log.groupName
    const currentGroupMembers = groupMembers.filter(m => m.groups?.name === groupName)

    // Get list of standard members for this group
    const standardMemberNames = currentGroupMembers.map(m => m.users?.name).filter(Boolean)

    // Get list of actual workers in the log
    const actualWorkers = [
      ...log.workers.director,
      ...log.workers.assistant,
      ...log.workers.video
    ]

    // Find added workers (in actual but not in standard)
    const added = actualWorkers.filter(w => !standardMemberNames.includes(w))
    // Find missing workers (in standard but not in actual)
    // const missing = standardMemberNames.filter(m => !actualWorkers.includes(m))

    if (added.length > 0) {
      return { type: 'change', count: added.length, names: added }
    }
    return null
  }

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

  // Delete confirmation dialog state
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean
    worklog: Worklog | null
  }>({
    open: false,
    worklog: null
  })

  const handleDeleteClick = (e: React.MouseEvent, log: Worklog) => {
    e.stopPropagation()
    setDeleteDialog({ open: true, worklog: log })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.worklog) return

    const { error } = await deleteWorklog(deleteDialog.worklog.id)

    if (error) {
      toast.error("삭제 중 오류가 발생했습니다.")
    } else {
      toast.success("업무일지가 삭제되었습니다.")
    }

    setDeleteDialog({ open: false, worklog: null })
  }

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

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, dateQuery, teamFilter, shiftFilter])

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

        // Special handling for status sorting (include '근무중' and '대기중')
        if (sortConfig.key === 'status') {
          const getEffectiveStatus = (log: Worklog) => {
            if (log.status !== '작성중') return log.status
            if (isWorkingNow(log)) return '근무중'

            // Check for Future (Waiting)
            const now = new Date()
            const [year, month, day] = log.date.split('-').map(Number)
            let start = new Date(year, month - 1, day)
            if (log.type === '주간') start.setHours(7, 30, 0, 0)
            else start.setHours(18, 30, 0, 0)

            if (now < start) return '대기중'
            return '작성중'
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

  // Pagination Logic
  const { totalPages, getPageItems } = usePagination(sortedWorklogs, ITEMS_PER_PAGE)
  const currentItems = getPageItems(currentPage)

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
    // Check if this is the currently active worklog
    // We only redirect to "Today Mode" if it's the session currently happening.
    // Past sessions of today (e.g. Day shift when it's Night) should open as normal tabs.
    const isActiveSession = isWorkingNow(log)

    if (isActiveSession) {
      router.push('/worklog?mode=today')
      return
    }

    addTab({
      id: String(log.id),
      title: `${log.date} ${log.groupName}`,
      date: log.date,
      type: log.type,
      team: log.groupName
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportWorklogsToExcel(filteredWorklogs)}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                엑셀 내보내기
              </Button>
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
                <TableHead className="text-center">비고</TableHead>
                <TableHead className="text-center">이슈</TableHead>

                <TableHead className="text-center">결제</TableHead>
                <TableHead className="text-center">AI요약</TableHead>
                <TableHead className="text-center w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentItems.map((log) => {
                const workerChanges = getWorkerChanges(log)
                return (
                  <TableRow
                    key={log.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleRowClick(log)}
                  >
                    <TableCell className="font-medium text-center">{log.date}</TableCell>
                    <TableCell className="text-center">{log.groupName}</TableCell>
                    <TableCell className="text-center">{log.type}</TableCell>
                    <TableCell className="text-center">
                      <span className="text-xs text-muted-foreground whitespace-pre-wrap">
                        {[
                          ...log.workers.director,
                          ...log.workers.assistant,
                          ...log.workers.video
                        ].join(', ')}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          isWorkingNow(log) && log.status === '작성중' ? 'default' :
                            (log.status === '작성중' ? 'secondary' :
                              (log.status === '일지확정' ? 'default' :
                                (log.status === '결재완료' ? 'default' : 'outline')))
                        }
                        className={cn(
                          "text-xs",
                          isWorkingNow(log) && log.status === '작성중' && "bg-green-600 hover:bg-green-700",
                          // [NEW] 'Waiting' style for future logs
                          !isWorkingNow(log) && log.status === '작성중' && (
                            (() => {
                              const now = new Date()
                              const [year, month, day] = log.date.split('-').map(Number)
                              let start = new Date(year, month - 1, day)
                              if (log.type === '주간') start.setHours(7, 30, 0, 0)
                              else start.setHours(18, 30, 0, 0)
                              return now < start
                            })()
                          ) && "bg-amber-100 text-amber-800 hover:bg-amber-200",
                          log.status === '일지확정' && "bg-indigo-600 hover:bg-indigo-700",
                          log.status === '결재완료' && "bg-slate-600 hover:bg-slate-700"
                        )}
                      >
                        {(() => {
                          if (log.status !== '작성중') {
                            if (log.status === '일지확정') return '확정됨'
                            if (log.status === '결재완료') return '결재됨'
                            return log.status
                          }
                          if (isWorkingNow(log)) return '근무중'

                          // Check for Future (Waiting)
                          const now = new Date()
                          const [year, month, day] = log.date.split('-').map(Number)
                          let start = new Date(year, month - 1, day)
                          if (log.type === '주간') start.setHours(7, 30, 0, 0)
                          else start.setHours(18, 30, 0, 0)

                          if (now < start) return '대기중'

                          return '작성중'
                        })()}
                      </Badge>
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

                    {/* Worker Changes Column */}
                    <TableCell className="text-center">
                      {workerChanges && (
                        <div className="flex justify-center group relative">
                          <Badge variant="destructive" className="text-[10px] px-1 py-0 h-5">
                            교체/추가
                          </Badge>
                          {/* Tooltip */}
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                            <div className="bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                              +{workerChanges.names.join(', ')}
                            </div>
                          </div>
                        </div>
                      )}
                    </TableCell>

                    {/* Issue Level Column */}
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        {log.maxPriority === '긴급' && (
                          <Badge variant="destructive" className="text-[10px] px-1 py-0 h-5 animate-pulse">
                            긴급
                          </Badge>
                        )}
                        {log.maxPriority === '중요' && (
                          <Badge variant="default" className="text-[10px] px-1 py-0 h-5 bg-orange-500 hover:bg-orange-600">
                            중요
                          </Badge>
                        )}
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
                    <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">메뉴 열기</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleRowClick(log)}>
                            <Edit2 className="mr-2 h-4 w-4" />
                            수정
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => handleDeleteClick(e, log)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card >

      <SimplePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* AI Summary Dialog */}
      < Dialog open={summaryDialog.open} onOpenChange={(open) => setSummaryDialog({ open, worklog: null, loading: false })
      }>
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
      </Dialog >

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, worklog: open ? deleteDialog.worklog : null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>업무일지 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteDialog.worklog && (
                <>
                  <strong>{deleteDialog.worklog.date}</strong> {deleteDialog.worklog.groupName} {deleteDialog.worklog.type} 업무일지를 삭제하시겠습니까?
                  <br />
                  <span className="text-red-500">이 작업은 되돌릴 수 없습니다.</span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  )
}

function WorkLogPageContent() {
  const { tabs, activeTab, setActiveTab, removeTab, addTab, closeAllTabs } = useWorklogTabStore()
  const searchParams = useSearchParams()
  const router = useRouter()
  const worklogs = useWorklogStore((state) => state.worklogs)
  const fetchWorklogs = useWorklogStore((state) => state.fetchWorklogs)
  const mode = searchParams.get('mode')
  const { currentSession } = useAuthStore()

  // Effect 1: Handle URL -> ActiveTab Sync (Routing)
  useEffect(() => {
    const id = searchParams.get('id')

    if (mode === 'today') return

    if (id) {
      // Always sync activeTab to URL id, even if tab doesn't exist yet
      // (addTab might not have finished updating the store)
      if (activeTab !== id) {
        setActiveTab(id)
      }
    } else {
      if (activeTab !== 'list') {
        setActiveTab('list')
      }
    }
  }, [searchParams, mode, activeTab, setActiveTab])

  // Effect 2: Handle Data -> Tab Creation/Update (Hydration)
  useEffect(() => {
    const id = searchParams.get('id')

    if (!id || mode === 'today') return

    const existingTab = tabs.find(t => t.id === id)
    const log = worklogs.find(w => String(w.id) === id)

    if (!existingTab) {
      if (id === 'new') {
        // 'new' tab is handled by the creation flow, but if accessed directly via URL:
        // Read date/team/type from URL params
        const urlDate = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd')
        const urlType = searchParams.get('type')
        const urlTeam = searchParams.get('team')
        addTab({
          id: 'new',
          title: '새 업무일지',
          date: urlDate,
          type: urlType === 'day' ? '주간' : urlType === 'night' ? '야간' : 'new',
          team: urlTeam || undefined
        })
      } else {
        // [CLEANUP] If we are navigating to a specific log, close the 'new' tab if it exists
        // This handles the redirect from "New Worklog" -> "Existing Duplicate Log" case
        const newTabExists = tabs.find(t => t.id === 'new')
        if (newTabExists) {
          removeTab('new')
        }

        if (log) {
          addTab({
            id: String(log.id),
            title: `${log.date} ${log.groupName}`,
            date: log.date,
            type: log.type,
            team: log.groupName
          })
        } else {
          // Log not in worklogs yet - add placeholder tab and wait for worklogs to load
          addTab({
            id: id,
            title: `로딩중...`,
            date: '',
            type: ''
          })
        }
      }
    } else {
      if (log) {
        const expectedTitle = `${log.date} ${log.groupName}`
        const needsUpdate =
          existingTab.title !== expectedTitle ||
          existingTab.date !== log.date ||
          existingTab.type !== log.type

        if (needsUpdate) {
          useWorklogTabStore.getState().updateTab(id, {
            title: expectedTitle,
            date: log.date,
            type: log.type
          })
        }
      }
    }
  }, [searchParams, worklogs, tabs, addTab, removeTab, mode])


  const handleCloseTab = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    removeTab(id)
  }

  const [todayWorklogId, setTodayWorklogId] = useState<string | null>(null)

  useEffect(() => {
    if (mode === 'today') {
      const today = format(new Date(), 'yyyy-MM-dd')
      const now = new Date()
      const hour = now.getHours()
      const isDayShift = hour >= 7 && hour < 18
      const defaultShiftType = isDayShift ? '주간' : '야간'

      const paramTeam = searchParams.get('team')
      const paramType = searchParams.get('type')

      const targetGroup = paramTeam || (currentSession ? currentSession.groupName : null)
      const targetShift = paramType ? (paramType === 'day' ? '주간' : '야간') : defaultShiftType

      const todayLog = worklogs.find(w =>
        w.date === today &&
        (targetGroup ? w.groupName === targetGroup : true) &&
        w.type === targetShift
      )

      setTodayWorklogId(todayLog ? String(todayLog.id) : 'new')
    }
  }, [mode, worklogs, currentSession, searchParams])

  // Dialog State
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newLogDate, setNewLogDate] = useState<Date>(new Date())
  const [newLogTeam, setNewLogTeam] = useState<string>("")
  const [newLogType, setNewLogType] = useState<string>("day")
  const [autoTeamLoading, setAutoTeamLoading] = useState(false)

  // Auto-calculate team when date or type changes
  useEffect(() => {
    const calculateTeam = async () => {
      if (!createDialogOpen) return

      console.log('[DEBUG calculateTeam] Starting with:', { newLogType, newLogDate: format(newLogDate, 'yyyy-MM-dd') })

      setAutoTeamLoading(true)
      try {
        const dateStr = format(newLogDate, 'yyyy-MM-dd')
        const config = await shiftService.getConfig(dateStr)

        if (config) {
          const teams = shiftService.getTeamsForDate(dateStr, config)
          console.log('[DEBUG calculateTeam] Teams for date:', teams)
          if (teams) {
            const team = newLogType === 'day' ? teams.A : teams.N
            console.log('[DEBUG calculateTeam] Calculated team:', team, '(newLogType:', newLogType, ')')
            setNewLogTeam(team)
          } else {
            setNewLogTeam("")
          }
        } else {
          setNewLogTeam("")
        }
      } catch (error) {
        console.error('Error calculating team:', error)
        setNewLogTeam("")
      } finally {
        setAutoTeamLoading(false)
      }
    }

    calculateTeam()
  }, [newLogDate, newLogType, createDialogOpen])

  const handleCreateWorklog = async () => {
    // Capture date and type from state
    const dateStr = format(newLogDate, 'yyyy-MM-dd')
    const typeStr = newLogType

    // COMPUTE TEAM DIRECTLY at click time to avoid stale state
    let teamStr = ''
    try {
      const config = await shiftService.getConfig(newLogDate)
      if (config) {
        const teams = shiftService.getTeamsForDate(newLogDate, config)
        if (teams) {
          teamStr = typeStr === 'day' ? teams.A : teams.N
        }
      }
    } catch (error) {
      console.error('[handleCreateWorklog] Error calculating team:', error)
    }

    console.log('[DEBUG handleCreateWorklog] Computed values:', { dateStr, typeStr, teamStr })

    if (!teamStr) {
      toast.error("근무조 계산에 실패했습니다. 다시 시도해주세요.")
      return
    }

    // Add the new worklog tab with team info BEFORE closing dialog
    addTab({
      id: 'new',
      title: '새 업무일지',
      date: dateStr,
      type: typeStr === 'day' ? '주간' : '야간',
      team: teamStr
    })

    console.log('[DEBUG handleCreateWorklog] After addTab, tabs:', useWorklogTabStore.getState().tabs)

    // Navigate to new worklog
    const url = `/worklog?id=new&date=${dateStr}&team=${teamStr}&type=${typeStr}`
    console.log('[DEBUG handleCreateWorklog] Navigating to:', url)
    router.push(url)

    // Close dialog LAST to prevent Effects from firing and overriding values
    setCreateDialogOpen(false)
  }

  const handleTabChange = (value: string) => {
    if (value === 'list') {
      router.push('/worklog', { scroll: false })
    } else {
      router.push(`/worklog?id=${value}`, { scroll: false })
    }
  }

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

  return (
    <MainLayout>
      <div className="px-8 pt-2 pb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">업무일지 저장소</h1>
            <p className="text-muted-foreground">주조정실 업무일지 목록입니다.</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />새 일지 작성
          </Button>
        </div>
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="print:hidden relative z-10 w-full overflow-x-auto">
            <FolderTabsList>
              <FolderTabsTrigger
                value="list"
                className={cn(
                  activeTab !== 'list' && "text-blue-600 font-semibold"
                )}
              >
                <div className="flex items-center gap-2 relative z-10">
                  <LayoutList className={cn(
                    "h-4 w-4",
                    activeTab !== 'list' ? "animate-lighthouse-shake text-blue-500" : "text-foreground"
                  )} />
                  <span className={cn(activeTab !== 'list' && "text-blue-600 font-semibold")}>업무일지 목록</span>
                </div>
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
              <WorklogDetail
                key={`${tab.id}-${tab.date}-${tab.type}-${tab.team || searchParams.get('team') || 'default'}`}
                worklogId={tab.id}
                tabDate={tab.date}
                tabType={tab.type}
                tabTeam={tab.team || (tab.id === 'new' ? searchParams.get('team') || undefined : undefined)}
              />
            </TabsContent>
          ))}
        </Tabs>

        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 업무일지 작성</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right text-sm font-medium">날짜</span>
                <div className="col-span-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newLogDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newLogDate ? format(newLogDate, "PPP", { locale: ko }) : <span>날짜 선택</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newLogDate}
                        onSelect={(date) => date && setNewLogDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right text-sm font-medium">근무조</span>
                <div className="col-span-3">
                  {autoTeamLoading ? (
                    <div className="h-10 flex items-center text-sm text-muted-foreground">
                      조회 중...
                    </div>
                  ) : newLogTeam ? (
                    <div className="h-10 flex items-center px-3 border rounded-md bg-muted/50 font-medium">
                      {newLogTeam}
                    </div>
                  ) : (
                    <div className="h-10 flex items-center px-3 border rounded-md text-sm text-red-500">
                      해당 날짜의 근무 패턴이 없습니다
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="text-right text-sm font-medium">근무 형태</span>
                <div className="col-span-3">
                  <Select value={newLogType} onValueChange={setNewLogType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">주간 (07:30 ~ 18:30)</SelectItem>
                      <SelectItem value="night">야간 (18:30 ~ 08:00)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>취소</Button>
              <Button onClick={handleCreateWorklog} disabled={autoTeamLoading || !newLogTeam}>
                {autoTeamLoading ? '계산 중...' : '작성하기'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
