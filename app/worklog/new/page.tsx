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
import { Save, ArrowLeft, Users, Loader2 } from "lucide-react"
import Link from "next/link"
import { shiftService, ShiftPatternConfig } from "@/lib/shift-rotation"
import { supabase } from "@/lib/supabase"

interface WorkerInfo {
  directors: string[]
  assistants: string[]
  videos: string[]
}

export default function NewWorkLog() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [shiftType, setShiftType] = useState<"주간" | "야간">("주간")

  // Auto-calculated state
  const [loading, setLoading] = useState(false)
  const [teamName, setTeamName] = useState<string | null>(null)
  const [teamId, setTeamId] = useState<string | null>(null)
  const [workers, setWorkers] = useState<WorkerInfo>({ directors: [], assistants: [], videos: [] })

  // Duplicate check
  const [isDuplicate, setIsDuplicate] = useState(false)
  const [existingLogId, setExistingLogId] = useState<string | null>(null)

  // Fetch team and workers when date or shiftType changes
  useEffect(() => {
    const fetchTeamAndWorkers = async () => {
      if (!date || !shiftType) return

      setLoading(true)
      try {
        // 1. Get shift pattern config for the selected date
        const config = await shiftService.getConfig(date)
        if (!config) {
          setTeamName(null)
          setWorkers({ directors: [], assistants: [], videos: [] })
          setLoading(false)
          return
        }

        // 2. Get teams for the selected date
        const teams = shiftService.getTeamsForDate(date, config)
        if (!teams) {
          setTeamName(null)
          setWorkers({ directors: [], assistants: [], videos: [] })
          setLoading(false)
          return
        }

        // 3. Determine team based on shift type
        const selectedTeam = shiftType === "주간" ? teams.A : teams.N
        setTeamName(selectedTeam)

        // 4. Get shift info to check if swap is active
        const shiftInfo = shiftService.calculateShift(date, selectedTeam, config)
        const isSwap = shiftInfo.isSwap

        // 5. Get group ID for the team
        const { data: groupData } = await supabase
          .from("groups")
          .select("id")
          .eq("name", selectedTeam)
          .single()

        if (!groupData) {
          setTeamId(null)
          setWorkers({ directors: [], assistants: [], videos: [] })
          setLoading(false)
          return
        }

        setTeamId(groupData.id)

        // 6. Fetch team members
        const { data: members } = await supabase
          .from("group_members")
          .select(`
            display_order,
            user:users(id, name, role)
          `)
          .eq("group_id", groupData.id)
          .order("display_order")

        if (!members || members.length === 0) {
          setWorkers({ directors: [], assistants: [], videos: [] })
          setLoading(false)
          return
        }

        // 7. Assign roles based on display_order and swap status
        // Default order: director=0, assistant=1, video=2+
        // Swap: director=1, assistant=0, video=2+
        const sortedMembers = members.filter((m: any) => m.user).sort((a: any, b: any) => a.display_order - b.display_order)

        const directorIndex = isSwap ? 1 : 0
        const assistantIndex = isSwap ? 0 : 1

        const workerInfo: WorkerInfo = {
          directors: [],
          assistants: [],
          videos: []
        }

        sortedMembers.forEach((m: any, idx: number) => {
          if (idx === directorIndex) {
            workerInfo.directors.push(m.user.name)
          } else if (idx === assistantIndex) {
            workerInfo.assistants.push(m.user.name)
          } else {
            workerInfo.videos.push(m.user.name)
          }
        })

        setWorkers(workerInfo)

        // 8. Check for duplicate worklog
        const { data: existingLog } = await supabase
          .from("worklogs")
          .select("id")
          .eq("group_id", groupData.id)
          .eq("date", date)
          .eq("type", shiftType)
          .maybeSingle()

        if (existingLog) {
          setIsDuplicate(true)
          setExistingLogId(existingLog.id)
        } else {
          setIsDuplicate(false)
          setExistingLogId(null)
        }

      } catch (error) {
        console.error("Error fetching team and workers:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTeamAndWorkers()
  }, [date, shiftType])

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
              <p className="text-muted-foreground">날짜와 근무형태를 선택하면 근무조와 근무자가 자동으로 표시됩니다.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">임시저장</Button>
            <Button disabled={isDuplicate || !teamName}>
              <Save className="mr-2 h-4 w-4" />
              저장하기
            </Button>
          </div>
        </div>

        {isDuplicate && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold">주의:</span>
              <span>이미 작성된 업무일지가 존재합니다 ({date} {teamName} {shiftType}).</span>
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
                <Label htmlFor="type">근무 형태</Label>
                <Select value={shiftType} onValueChange={(v) => setShiftType(v as "주간" | "야간")}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="근무 형태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="주간">주간 (07:30 - 19:00)</SelectItem>
                    <SelectItem value="야간">야간 (18:30 - 08:00)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Auto-calculated Team and Workers */}
            <Separator className="my-4" />

            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">근무 정보 조회 중...</span>
              </div>
            ) : teamName ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">근무조:</span>
                  <span className="text-lg font-semibold text-primary">{teamName}</span>
                </div>

                <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <span className="text-sm text-muted-foreground">감독</span>
                    <p className="font-medium">{workers.directors.join(", ") || "-"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">부감독</span>
                    <p className="font-medium">{workers.assistants.join(", ") || "-"}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">영상</span>
                    <p className="font-medium">{workers.videos.join(", ") || "-"}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                해당 날짜의 근무 패턴 정보를 찾을 수 없습니다.
              </div>
            )}
          </CardContent>
        </Card>

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
