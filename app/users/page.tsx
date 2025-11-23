import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Plus, Search, MoreHorizontal } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function UsersPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">사용자 관리</h1>
            <p className="text-muted-foreground">시스템 사용자 및 권한을 관리합니다.</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            사용자 추가
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>사용자 목록</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="이름 또는 이메일 검색..." className="pl-8" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>사용자</TableHead>
                  <TableHead>역할</TableHead>
                  <TableHead>소속</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>최근 접속</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  {
                    name: "관리자",
                    email: "admin@mbcplus.com",
                    role: "admin",
                    team: "운영팀",
                    status: "active",
                    lastLogin: "방금 전",
                  },
                  {
                    name: "김주조",
                    email: "kim@mbcplus.com",
                    role: "director",
                    team: "3팀",
                    status: "active",
                    lastLogin: "1시간 전",
                  },
                  {
                    name: "이영상",
                    email: "lee@mbcplus.com",
                    role: "team_leader",
                    team: "2팀",
                    status: "active",
                    lastLogin: "3시간 전",
                  },
                  {
                    name: "박예비",
                    email: "park@mbcplus.com",
                    role: "backup_director",
                    team: "1팀",
                    status: "inactive",
                    lastLogin: "2일 전",
                  },
                ].map((user, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>{user.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {user.role === "admin" && "관리자"}
                        {user.role === "director" && "주조감독"}
                        {user.role === "team_leader" && "영상감독"}
                        {user.role === "backup_director" && "예비감독"}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.team}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${user.status === "active" ? "bg-green-500" : "bg-gray-300"}`}
                        />
                        <span className="text-sm">{user.status === "active" ? "활성" : "비활성"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.lastLogin}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
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
