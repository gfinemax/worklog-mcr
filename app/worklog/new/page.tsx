import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Save, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewWorkLog() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/worklog">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">새 업무일지 작성</h1>
              <p className="text-muted-foreground">오늘의 업무 내용을 기록합니다.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">임시저장</Button>
            <Button>
              <Save className="mr-2 h-4 w-4" />
              저장하기
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">근무일자</Label>
                  <Input id="date" type="date" defaultValue="2025-11-20" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shift">근무조</Label>
                  <Select defaultValue="team3">
                    <SelectTrigger id="shift">
                      <SelectValue placeholder="근무조 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="team1">1팀</SelectItem>
                      <SelectItem value="team2">2팀</SelectItem>
                      <SelectItem value="team3">3팀</SelectItem>
                      <SelectItem value="team4">4팀</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">근무 형태</Label>
                <Select defaultValue="day">
                  <SelectTrigger id="type">
                    <SelectValue placeholder="근무 형태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">주간 (07:30 - 19:00)</SelectItem>
                    <SelectItem value="night">야간 (18:30 - 08:00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>근무자 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="director">주조감독</Label>
                  <Input id="director" placeholder="이름 입력" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cms">CMS감독</Label>
                  <Input id="cms" placeholder="이름 입력" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backup">예비감독</Label>
                  <Input id="backup" placeholder="이름 입력" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video">영상감독</Label>
                  <Input id="video" placeholder="이름 입력" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>채널별 송출사항</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {["MBC SPORTS+", "MBC Every1", "MBC DRAMA", "MBC M", "MBC ON"].map((channel) => (
              <div key={channel} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{channel}</h3>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground">운행표 등록 횟수:</Label>
                    <Select defaultValue="0">
                      <SelectTrigger className="w-[80px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3, 4, 5].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}회
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Textarea placeholder={`${channel} 주요 송출 내용을 입력하세요...`} className="min-h-[100px]" />
                <Separator />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>장비 및 시스템 주요사항</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>주요 이슈</Label>
              <Textarea placeholder="장비 또는 시스템 관련 주요 이슈를 입력하세요..." className="min-h-[150px]" />
            </div>
            <div className="space-y-2">
              <Label>추가 사항</Label>
              <Textarea placeholder="기타 추가 사항을 입력하세요..." />
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
