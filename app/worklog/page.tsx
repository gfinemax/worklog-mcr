import Link from "next/link"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Filter, FileText } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function WorkLogList() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">업무일지</h1>
            <p className="text-muted-foreground">주조정실 업무일지 목록입니다.</p>
          </div>
          <Link href="/worklog/new">
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
                  <TableHead>날짜</TableHead>
                  <TableHead>근무조</TableHead>
                  <TableHead>근무 형태</TableHead>
                  <TableHead>작성자</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>서명</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  {
                    id: 1,
                    date: "2025-11-20",
                    team: "3팀",
                    type: "주간",
                    author: "김주조",
                    status: "작성중",
                    signature: "1/4",
                  },
                  {
                    id: 2,
                    date: "2025-11-19",
                    team: "2팀",
                    type: "야간",
                    author: "이영상",
                    status: "완료",
                    signature: "4/4",
                  },
                  {
                    id: 3,
                    date: "2025-11-19",
                    team: "2팀",
                    type: "주간",
                    author: "박예비",
                    status: "완료",
                    signature: "4/4",
                  },
                  {
                    id: 4,
                    date: "2025-11-18",
                    team: "1팀",
                    type: "야간",
                    author: "최CMS",
                    status: "완료",
                    signature: "4/4",
                  },
                  {
                    id: 5,
                    date: "2025-11-18",
                    team: "1팀",
                    type: "주간",
                    author: "정주조",
                    status: "완료",
                    signature: "4/4",
                  },
                ].map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.date}</TableCell>
                    <TableCell>{log.team}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.type}</Badge>
                    </TableCell>
                    <TableCell>{log.author}</TableCell>
                    <TableCell>
                      <Badge variant={log.status === "완료" ? "secondary" : "default"}>{log.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">{log.signature}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <FileText className="h-4 w-4" />
                        <span className="sr-only">상세보기</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
