"use client"

import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useAuthStore } from "@/store/auth"
import { Laptop, Shield } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AuditLogList } from "@/components/settings/audit-log-list"

export default function SettingsPage() {
  const { deviceMode, setDeviceMode, securitySettings, setSecuritySettings } = useAuthStore()

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">프로그램 설정</h1>
          <p className="text-muted-foreground">시스템 및 개인 설정을 관리합니다.</p>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">일반 설정</TabsTrigger>
            <TabsTrigger value="audit">변경 이력 (Audit)</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="grid gap-6">
              {/* Device Context Setting */}
              <Card className="border-blue-200 bg-blue-50/30">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Laptop className="h-5 w-5 text-blue-600" />
                    <CardTitle>기기 모드 설정 (Device Context)</CardTitle>
                  </div>
                  <CardDescription>현재 사용 중인 기기의 용도를 설정합니다.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">공용 PC 모드 (Shared/Kiosk)</Label>
                      <p className="text-sm text-muted-foreground">
                        주조정실 메인 PC 등 여러 사람이 함께 사용하는 기기에서 활성화하세요.<br />
                        <span className="text-xs text-blue-600 font-medium">
                          * 중요 작업 시 PIN 인증 요구 / 게스트 로그인 지원 / 세션 유지 강화
                        </span>
                      </p>
                    </div>
                    <Switch
                      checked={deviceMode === 'shared'}
                      onCheckedChange={(checked) => setDeviceMode(checked ? 'shared' : 'personal')}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Security Settings */}
              <Card className="border-slate-200">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-slate-600" />
                    <CardTitle>보안 설정</CardTitle>
                  </div>
                  <CardDescription>보안 관련 옵션을 설정합니다.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">멤버 전환 시 PIN 인증 요구</Label>
                      <p className="text-sm text-muted-foreground">
                        상단 메뉴에서 멤버를 전환할 때 PIN 번호를 입력하도록 합니다.<br />
                        <span className="text-xs text-slate-500">
                          * 끄면 즉시 전환됩니다. (개인 기기에서 권장)
                        </span>
                      </p>
                    </div>
                    <Switch
                      checked={securitySettings?.requirePinForMemberSwitch ?? true}
                      onCheckedChange={(checked) => setSecuritySettings({ requirePinForMemberSwitch: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

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
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <AuditLogList />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}
