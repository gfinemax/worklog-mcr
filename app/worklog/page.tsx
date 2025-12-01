"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, Sparkles } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useWorklogStore, Worklog } from "@/store/worklog"

type SortConfig = {
  key: keyof Worklog
  direction: 'asc' | 'desc'
} | null

export default function WorkLogList() {
  const router = useRouter()
  const worklogs = useWorklogStore((state) => state.worklogs)
  const updateWorklog = useWorklogStore((state) => state.updateWorklog)
  const fetchWorklogs = useWorklogStore((state) => state.fetchWorklogs)
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

  const sortedWorklogs = useMemo(() => {
    let sortableWorklogs = [...worklogs]
    if (sortConfig !== null) {
      sortableWorklogs.sort((a, b) => {
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
  }, [worklogs, sortConfig])

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

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">업무일지</h1>
            <p className="text-muted-foreground">주조정실 업무일지 목록입니다.</p>
          </div>
          <Link href="/worklog/today">
            <Button>
              <Plus className="mr-2 h-4 w-4" />새 일지 작성
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>일지 목록</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="검색..." className="pl-8" />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
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
                  <TableHead className="text-center">결제</TableHead>
                  <TableHead className="text-center">AI요약</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedWorklogs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => router.push(`/worklog/today?id=${log.id}`)}
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
      </div>
    </MainLayout>
  )
}
