"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, AlertCircle, CheckCircle2, Clock, Users, ArrowRight, Activity, Star, AlertTriangle } from "lucide-react"
import { useWorklogStore } from "@/store/worklog"
import { usePostStore, Post } from "@/store/posts"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export default function Dashboard() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const worklogs = useWorklogStore((state) => state.worklogs)
  const importantWorklogs = worklogs.filter(log => log.isImportant).slice(0, 5)

  const { posts, fetchPosts, resolvePost } = usePostStore()
  const [emergencyPosts, setEmergencyPosts] = useState<Post[]>([])
  const [resolveDialog, setResolveDialog] = useState<{ open: boolean, post: Post | null }>({ open: false, post: null })
  const [resolutionNote, setResolutionNote] = useState("")

  useEffect(() => {
    setMounted(true)
    fetchPosts({ priority: '긴급' })
  }, [])

  useEffect(() => {
    setEmergencyPosts(posts.filter(p => p.priority === '긴급' && p.status === 'open'))
  }, [posts])

  const handleResolveClick = (post: Post) => {
    setResolveDialog({ open: true, post })
  }

  const confirmResolve = async () => {
    if (!resolveDialog.post) return
    try {
      await resolvePost(resolveDialog.post.id, resolutionNote)
      toast.success("이슈가 해결 처리되었습니다.")
      setResolveDialog({ open: false, post: null })
      setResolutionNote("")
    } catch (error) {
      toast.error("처리 중 오류가 발생했습니다.")
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">대시보드</h1>
            <p className="text-muted-foreground">오늘의 주조정실 업무 현황입니다.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full">2025년 11월 20일 (수)</span>
            <Button onClick={() => router.push('/worklog/today')}>
              <FileText className="mr-2 h-4 w-4" />
              일지 작성하기
            </Button>
          </div>
        </div>

        {/* Emergency Issues Section */}
        {emergencyPosts.length > 0 && (
          <Card className="border-red-200 bg-red-50/50 animate-in fade-in slide-in-from-top-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5 animate-pulse" />
                  <CardTitle>긴급 이슈 발생 ({emergencyPosts.length}건)</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {emergencyPosts.map(post => (
                  <div key={post.id} className="flex items-center justify-between p-3 bg-white border border-red-100 rounded-lg shadow-sm">
                    <div className="space-y-1 cursor-pointer" onClick={() => router.push(`/posts/${post.id}`)}>
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="animate-pulse">긴급</Badge>
                        <span className="font-bold hover:underline">{post.title}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {post.summary || post.content.replace(/<[^>]*>?/gm, '').substring(0, 100)}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{post.author?.name}</span>
                        <span>•</span>
                        <span>{new Date(post.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                      onClick={() => handleResolveClick(post)}
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      해결 처리
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">현재 근무조</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3팀</div>
              <p className="text-xs text-muted-foreground">주간 근무 (07:30 - 19:00)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">운행표 등록</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4/5</div>
              <p className="text-xs text-muted-foreground">채널별 평균 등록 완료</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">이슈 사항</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{emergencyPosts.length}건</div>
              <p className="text-xs text-muted-foreground">미해결 긴급 이슈</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">서명 진행률</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">75%</div>
              <p className="text-xs text-muted-foreground">3/4 파트 서명 완료</p>
            </CardContent>
          </Card>
        </div>

        {/* Important Worklogs */}
        {importantWorklogs.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  <CardTitle>중요 업무일지</CardTitle>
                </div>
                <Link href="/worklog">
                  <Button variant="ghost" size="sm">
                    전체 보기
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {importantWorklogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{log.date}</p>
                          <Badge variant="outline" className="text-xs">{log.team}</Badge>
                          <Badge variant="outline" className="text-xs">{log.type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {[...log.workers.director, ...log.workers.assistant, ...log.workers.video]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                    </div>
                    <Badge variant={log.status === "서명완료" ? "secondary" : "default"}>
                      {log.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
          {/* Main Content - Work Log Status */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>채널별 운행 현황</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "MBC SPORTS+", status: "정상", count: 5, time: "18:30" },
                  { name: "MBC Every1", status: "주의", count: 3, time: "18:25" },
                  { name: "MBC DRAMA", status: "정상", count: 5, time: "18:20" },
                  { name: "MBC M", status: "정상", count: 4, time: "18:15" },
                  { name: "MBC ON", status: "정상", count: 5, time: "18:10" },
                ].map((channel) => (
                  <div key={channel.name} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-2 h-2 rounded-full ${channel.status === "정상" ? "bg-green-500" : "bg-yellow-500"
                          }`}
                      />
                      <div>
                        <p className="font-medium">{channel.name}</p>
                        <p className="text-sm text-muted-foreground">최종 업데이트: {channel.time}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">운행표 {channel.count}/5</p>
                        <Badge
                          variant={channel.status === "정상" ? "secondary" : "outline"}
                          className={channel.status === "주의" ? "text-yellow-600 border-yellow-200 bg-yellow-50" : ""}
                        >
                          {channel.status}
                        </Badge>
                      </div>
                      <Button variant="ghost" size="icon">
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Sidebar Content - Recent Activity & Issues */}
          <div className="col-span-3 space-y-6">
            {/* Recent Issues */}
            <Card>
              <CardHeader>
                <CardTitle>주요 이슈 사항</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3 items-start p-3 bg-destructive/5 rounded-lg border border-destructive/10">
                    <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-destructive">APC 서버 응답 지연</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        14:30경 간헐적 응답 지연 발생. 현재 모니터링 중.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start p-3 bg-muted rounded-lg border">
                    <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">네트워크 점검 완료</p>
                      <p className="text-xs text-muted-foreground mt-1">정기 점검 완료. 특이사항 없음.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Signatures */}
            <Card>
              <CardHeader>
                <CardTitle>업무확인 서명</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { role: "운행 파트", status: "completed", time: "18:45", name: "김운행" },
                    { role: "팀장 파트", status: "pending", time: "-", name: "-" },
                    { role: "MCR 파트", status: "completed", time: "18:50", name: "이주조" },
                    { role: "Network 파트", status: "completed", time: "18:55", name: "박네트" },
                  ].map((sig) => (
                    <div key={sig.role} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        {sig.status === "completed" ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium">{sig.role}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {sig.status === "completed" ? `${sig.name} (${sig.time})` : "대기중"}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Resolve Dialog */}
        <Dialog open={resolveDialog.open} onOpenChange={(open) => setResolveDialog({ ...resolveDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>이슈 해결 처리</DialogTitle>
              <DialogDescription>
                해당 긴급 이슈를 해결 상태로 변경합니다. 조치 내용을 간단히 입력해주세요.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">이슈 제목</h4>
                <p className="text-sm text-muted-foreground p-2 bg-muted rounded-md">
                  {resolveDialog.post?.title}
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">조치 내용</h4>
                <Textarea
                  placeholder="예: 장비 재부팅 후 정상화 확인됨"
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResolveDialog({ open: false, post: null })}>취소</Button>
              <Button onClick={confirmResolve} disabled={!resolutionNote.trim()}>
                해결 완료
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
