import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CheckCircle2, Clock, AlertCircle, Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function SignaturesPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">업무확인 서명</h1>
            <p className="text-muted-foreground">각 파트별 업무 확인 및 서명 현황을 관리합니다.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">전체 완료율</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">92%</div>
              <p className="text-xs text-muted-foreground">이번 달 기준</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">미서명 건수</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3건</div>
              <p className="text-xs text-muted-foreground">현재 대기 중</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">지연 건수</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">1건</div>
              <p className="text-xs text-muted-foreground">24시간 이상 지연</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>서명 현황 목록</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="날짜 또는 담당자 검색..." className="pl-8" />
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
                  <TableHead>운행 파트</TableHead>
                  <TableHead>팀장 파트</TableHead>
                  <TableHead>MCR 파트</TableHead>
                  <TableHead>Network 파트</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="text-right">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  {
                    date: "2025-11-20",
                    team: "3팀",
                    op: { status: "done", name: "김운행", time: "18:45" },
                    leader: { status: "pending", name: "-", time: "-" },
                    mcr: { status: "done", name: "이주조", time: "18:50" },
                    net: { status: "done", name: "박네트", time: "18:55" },
                    status: "진행중",
                  },
                  {
                    date: "2025-11-19",
                    team: "2팀",
                    op: { status: "done", name: "최운행", time: "08:10" },
                    leader: { status: "done", name: "정팀장", time: "08:30" },
                    mcr: { status: "done", name: "강주조", time: "08:15" },
                    net: { status: "done", name: "윤네트", time: "08:20" },
                    status: "완료",
                  },
                ].map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{row.date}</TableCell>
                    <TableCell>{row.team}</TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        {row.op.status === "done" ? (
                          <>
                            <span className="font-medium text-green-600">{row.op.name}</span>
                            <span className="text-muted-foreground">{row.op.time}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">대기중</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        {row.leader.status === "done" ? (
                          <>
                            <span className="font-medium text-green-600">{row.leader.name}</span>
                            <span className="text-muted-foreground">{row.leader.time}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">대기중</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        {row.mcr.status === "done" ? (
                          <>
                            <span className="font-medium text-green-600">{row.mcr.name}</span>
                            <span className="text-muted-foreground">{row.mcr.time}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">대기중</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        {row.net.status === "done" ? (
                          <>
                            <span className="font-medium text-green-600">{row.net.name}</span>
                            <span className="text-muted-foreground">{row.net.time}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">대기중</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={row.status === "완료" ? "secondary" : "outline"}>{row.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" disabled={row.status === "완료"}>
                        서명하기
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
