"use client"

import { useState, useEffect } from "react"
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
import { useAuthStore } from "@/store/auth"

export default function NewWorkLog() {
  const { currentSession } = useAuthStore()
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([])
  const [isDuplicate, setIsDuplicate] = useState(false)
  const [existingLogId, setExistingLogId] = useState<string | null>(null)

  // Form State
  const [director, setDirector] = useState("")
  const [cms, setCms] = useState("")
  const [backup, setBackup] = useState("")
  const [video, setVideo] = useState("")
  const [team, setTeam] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [shiftType, setShiftType] = useState("주간")

  useEffect(() => {
    const fetchGroups = async () => {
      const { data } = await import("@/lib/supabase").then(m => m.supabase.from("groups").select("id, name").order("name"))
      if (data) {
        setGroups(data)
        // Set default team if currentSession exists
        if (currentSession) {
          const matchingGroup = data.find(g => g.id === currentSession.groupId)
          if (matchingGroup) setTeam(matchingGroup.id)
        }
      }
    }
    fetchGroups()
  }, [currentSession])

  useEffect(() => {
    if (currentSession) {
      // Map Workers
      const directors = currentSession.members.filter(m => m.role === '감독').map(m => m.name)
      const assistants = currentSession.members.filter(m => m.role === '부감독').map(m => m.name)
      const videos = currentSession.members.filter(m => m.role === '영상').map(m => m.name)

      if (directors.length > 0) setDirector(directors[0])
      if (assistants.length > 0) setCms(assistants[0])
      if (assistants.length > 1) setBackup(assistants[1])
      if (videos.length > 0) setVideo(videos[0])
    }
  }, [currentSession])

  // Check for duplicates
  useEffect(() => {
    const checkDuplicate = async () => {
      if (!team || !date || !shiftType) return

      const { data } = await import("@/lib/supabase").then(m => m.supabase
        .from("worklogs")
        .select("id")
        .eq("group_id", team)
        .eq("date", date)
        .eq("type", shiftType)
        .maybeSingle()
      )

      if (data) {
        setIsDuplicate(true)
        setExistingLogId(data.id)
      } else {
        setIsDuplicate(false)
        setExistingLogId(null)
      }
    }
    checkDuplicate()
  }, [team, date, shiftType])

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
            <Button disabled={isDuplicate}>
              <Save className="mr-2 h-4 w-4" />
              저장하기
            </Button>
          </div>
        </div>

        {isDuplicate && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold">주의:</span>
              <span>이미 작성된 업무일지가 존재합니다 ({date} {shiftType}).</span>
            </div>
            {existingLogId && (
              <Link href={`/worklog/${existingLogId}`}>
                <Button variant="outline" size="sm" className="bg-white hover:bg-red-50 border-red-200 text-red-700">
                  기존 일지 보러가기
                </Button>
              </Link>
            )}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">근무일자</Label>
                  <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shift">근무조</Label>
                  <Select value={team} onValueChange={setTeam}>
                    <SelectTrigger id="shift">
                      <SelectValue placeholder="근무조 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {groups.map(g => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">근무 형태</Label>
                <Select value={shiftType} onValueChange={setShiftType}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="근무 형태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="주간">주간 (07:30 - 19:00)</SelectItem>
                    <SelectItem value="야간">야간 (18:30 - 08:00)</SelectItem>
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
                  <Input id="director" placeholder="이름 입력" value={director} onChange={(e) => setDirector(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cms">CMS감독</Label>
                  <Input id="cms" placeholder="이름 입력" value={cms} onChange={(e) => setCms(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backup">예비감독</Label>
                  <Input id="backup" placeholder="이름 입력" value={backup} onChange={(e) => setBackup(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="video">영상감독</Label>
                  <Input id="video" placeholder="이름 입력" value={video} onChange={(e) => setVideo(e.target.value)} />
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
