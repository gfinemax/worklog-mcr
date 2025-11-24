"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
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
  const worklogs = useWorklogStore((state) => state.worklogs)
  const updateWorklog = useWorklogStore((state) => state.updateWorklog)
  const [sortConfig, setSortConfig] = useState<SortConfig>(null)
  const [summaryDialog, setSummaryDialog] = useState<{
    open: boolean
    worklog: Worklog | null
    loading: boolean
  }>({
    open: false,
    worklog: null,
    loading: false
  })

  const handleImportantToggle = (id: number, checked: boolean) => {
    updateWorklog(id, { isImportant: checked })
  }

  const generateSummary = async (worklog: Worklog): Promise<string> => {
    // 임시 템플릿 (향후 AI API로 대체)
    await new Promise(resolve => setTimeout(resolve, 1000)) // 로딩 시뮬레이션

    const workers = [...worklog.workers.director, ...worklog.workers.assistant, ...worklog.workers.video]
      .filter(Boolean)
      .join(", ")

    return `[${worklog.date}] ${worklog.team} ${worklog.type} 근무

근무자: ${workers}

주요 내용:
- 채널별 운행표 등록 완료
- 특이사항 없음
- 정상 운영 중

상태: ${worklog.status}
서명 진행률: ${worklog.signature}`
  }

  const handleSummaryClick = async (worklog: Worklog) => {
    setSummaryDialog({ open: true, worklog, loading: !worklog.aiSummary })

    if (!worklog.aiSummary) {
      const summary = await generateSummary(worklog)
      updateWorklog(worklog.id, { aiSummary: summary })
      setSummaryDialog(prev => ({ ...prev, loading: false }))
    }
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
                    <Button variant="ghost" onClick={() => requestSort('team')} className="group h-8 p-0 font-bold hover:bg-transparent hover:text-foreground w-full justify-center">
                      <span className="relative flex items-center">
                        근무조
                        <span className="absolute left-full ml-2 top-1/2 -translate-y-1/2">
                          {getSortIcon('team')}
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
                  <TableHead className="text-center">서명</TableHead>
                  <TableHead className="text-center">AI요약</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedWorklogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium text-center">{log.date}</TableCell>
                    <TableCell className="text-center">{log.team}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{log.type}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {[...log.workers.director, ...log.workers.assistant, ...log.workers.video]
                        .filter(Boolean)
                        .join(", ")}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={log.status === "완료" ? "secondary" : "default"}>{log.status}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
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
                    <TableCell className="text-center">
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
                  <Badge variant="outline">{summaryDialog.worklog.team}</Badge>
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
            <DialogFooter>
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
