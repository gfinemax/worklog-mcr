import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Settings, Activity, AlertTriangle } from "lucide-react"

export default function ChannelList() {
  const channels = [
    { name: "MBC SPORTS+", code: "MSP", status: "active", type: "Sports" },
    { name: "MBC Every1", code: "ME1", status: "active", type: "Entertainment" },
    { name: "MBC DRAMA", code: "MDR", status: "active", type: "Drama" },
    { name: "MBC M", code: "MM", status: "active", type: "Music" },
    { name: "MBC ON", code: "MON", status: "active", type: "Classic" },
  ]

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">채널 관리</h1>
            <p className="text-muted-foreground">송출 채널 상태 및 설정을 관리합니다.</p>
          </div>
          <Button variant="outline">
            <Settings className="mr-2 h-4 w-4" />
            채널 설정
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {channels.map((channel) => (
            <Card key={channel.code}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-bold">{channel.name}</CardTitle>
                <Badge variant="secondary">{channel.code}</Badge>
              </CardHeader>
              <CardContent>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">상태</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      <span className="font-medium">정상 송출중</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">유형</span>
                    <span>{channel.type}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">오늘의 이슈</span>
                    <span className="font-medium">0건</span>
                  </div>
                  <div className="pt-4 flex gap-2">
                    <Button className="flex-1 bg-transparent" variant="outline">
                      <Activity className="mr-2 h-4 w-4" />
                      모니터링
                    </Button>
                    <Button className="flex-1 bg-transparent" variant="outline">
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      이슈 등록
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  )
}
