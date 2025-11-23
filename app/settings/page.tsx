import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

export default function SettingsPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">설정</h1>
          <p className="text-muted-foreground">시스템 및 개인 설정을 관리합니다.</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>프로필 설정</CardTitle>
              <CardDescription>개인 정보 및 비밀번호를 변경합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">이름</Label>
                <Input id="name" defaultValue="관리자" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">이메일</Label>
                <Input id="email" defaultValue="admin@mbcplus.com" disabled />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">새 비밀번호</Label>
                <Input id="password" type="password" />
              </div>
              <Button>변경사항 저장</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>알림 설정</CardTitle>
              <CardDescription>이메일 및 시스템 알림을 설정합니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>이메일 알림</Label>
                  <p className="text-sm text-muted-foreground">주요 이슈 발생 시 이메일로 알림을 받습니다.</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>서명 요청 알림</Label>
                  <p className="text-sm text-muted-foreground">새로운 서명 요청이 있을 때 알림을 받습니다.</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  )
}
