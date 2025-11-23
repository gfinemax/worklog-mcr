import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Printer, FileBarChart } from "lucide-react"

export default function ReportsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">통계 및 보고서</h1>
            <p className="text-muted-foreground">업무 현황 통계 및 보고서를 조회하고 출력합니다.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Printer className="mr-2 h-4 w-4" />
              인쇄
            </Button>
            <Button>
              <Download className="mr-2 h-4 w-4" />
              내보내기
            </Button>
          </div>
        </div>

        <Tabs defaultValue="daily" className="space-y-4">
          <TabsList>
            <TabsTrigger value="daily">일일 보고서</TabsTrigger>
            <TabsTrigger value="weekly">주간 보고서</TabsTrigger>
            <TabsTrigger value="monthly">월간 통계</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>일일 업무 보고서</CardTitle>
                  <Select defaultValue="today">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="날짜 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">2025-11-20 (오늘)</SelectItem>
                      <SelectItem value="yesterday">2025-11-19 (어제)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border p-8 space-y-8">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold">주조정실 업무일지</h2>
                    <p className="text-muted-foreground">2025년 11월 20일 수요일</p>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="font-semibold border-b pb-2">근무 현황</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">근무조</span>
                        <span>3팀</span>
                        <span className="text-muted-foreground">근무시간</span>
                        <span>07:30 - 19:00</span>
                        <span className="text-muted-foreground">주조감독</span>
                        <span>김주조</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-semibold border-b pb-2">운행 현황</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">총 채널</span>
                        <span>5개</span>
                        <span className="text-muted-foreground">운행표 등록</span>
                        <span>24/25 (96%)</span>
                        <span className="text-muted-foreground">이슈 발생</span>
                        <span className="text-destructive">2건</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold border-b pb-2">주요 이슈 사항</h3>
                    <div className="space-y-2 text-sm">
                      <p>1. [14:30] APC 서버 응답 지연 발생 (조치중)</p>
                      <p>2. [16:00] 네트워크 정기 점검 완료 (특이사항 없음)</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weekly">
            <Card>
              <CardHeader>
                <CardTitle>주간 업무 통계</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                  <div className="text-center">
                    <FileBarChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>주간 통계 차트가 여기에 표시됩니다.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
