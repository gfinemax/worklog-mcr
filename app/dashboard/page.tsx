"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileText, AlertCircle, CheckCircle2, Clock, Users, ArrowRight, Activity, Star, AlertTriangle, LogIn, RefreshCw, ClipboardList, Sunrise, Sunset, CloudSun } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useWorklogStore } from "@/store/worklog"
import { usePostStore, Post } from "@/store/posts"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/auth"
import { LoginForm } from "@/components/auth/login-form"
import { SessionSetupStep } from "@/components/auth/session-setup-step"
import { PostEditor } from "@/components/post-editor"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export default function Dashboard() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const worklogs = useWorklogStore((state) => state.worklogs)
  const { fetchWorklogs } = useWorklogStore() // Added fetchWorklogs
  const importantWorklogs = worklogs.filter(log => log.isImportant).slice(0, 5)

  const { posts, fetchPosts, resolvePost } = usePostStore()
  const [emergencyPosts, setEmergencyPosts] = useState<Post[]>([])
  const [resolveDialog, setResolveDialog] = useState<{ open: boolean, post: Post | null }>({ open: false, post: null })
  const [postDialogOpen, setPostDialogOpen] = useState(false)
  const [resolutionNote, setResolutionNote] = useState("")

  const { loginMode, currentSession, nextSession, setNextUser, setNextSession } = useAuthStore()
  const [handoverDialogOpen, setHandoverDialogOpen] = useState(false)
  const [handoverStep, setHandoverStep] = useState<'login' | 'setup'>('login')
  const [handoverData, setHandoverData] = useState<any>(null)

  const handleHandoverLoginSuccess = (data: any) => {
    setHandoverData(data)
    setHandoverStep('setup')
  }

  const handleHandoverComplete = (members: any[]) => {
    if (!handoverData) return

    const { profile, groupData } = handoverData
    setNextUser(profile)
    setNextSession({
      groupId: groupData.id,
      groupName: groupData.name,
      members: members,
      startedAt: new Date().toISOString()
    })

    toast.success(`${groupData.name} 교대 근무 로그인이 완료되었습니다.`)
    setHandoverDialogOpen(false)
    setTimeout(() => {
      setHandoverStep('login')
      setHandoverData(null)
    }, 300)
  }

  // Shift Info State
  const [shiftInfo, setShiftInfo] = useState<any>(null)

  // Weather State
  const [weather, setWeather] = useState<{
    description: string
    emoji: string
    temp: number
    tempMin: number
    tempMax: number
    humidity: number
    sunrise: string
    sunset: string
    location: string
  } | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)

  // Fetch Weather Data
  const fetchWeather = async () => {
    if (weatherLoading || weather) return
    setWeatherLoading(true)
    try {
      const res = await fetch('/api/weather')
      if (res.ok) {
        const data = await res.json()
        setWeather(data)
      }
    } catch (error) {
      console.error('Failed to fetch weather:', error)
    } finally {
      setWeatherLoading(false)
    }
  }

  // Hoist Logic for Current Worklog
  const currentLog = currentSession ? worklogs.find(log =>
    log.groupName === currentSession.groupName &&
    (log.status === '작성중' || log.date === new Date().toISOString().split('T')[0])
  ) : null

  // Previous Worklog (First one that isn't current)
  const previousLog = worklogs.find(log => log.id !== currentLog?.id)

  // Calculate Progress for Current Log
  const signatureProgress = currentLog ? Object.values(currentLog.signatures || {}).filter(Boolean).length : 0

  // Helper to parse signature
  const parseSignature = (value: string | null) => {
    if (!value) return null
    if (value === 'System Auto-Close') return { name: '시스템', time: '자동' }
    try {
      const parsed = JSON.parse(value)
      const time = new Date(parsed.signed_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
      return { name: parsed.name, time }
    } catch (e) {
      return { name: value, time: '-' }
    }
  }

  useEffect(() => {
    setMounted(true)
    fetchPosts({ priority: '긴급' })
    fetchWorklogs()

    // Fetch Shift Info if session is active
    const loadShiftInfo = async () => {
      if (currentSession?.groupName) {
        const shiftService = await import("@/lib/shift-rotation").then(m => m.shiftService)
        const config = await shiftService.getConfig()
        if (config) {
          // Use logical date (handle past-midnight night shift)
          const { date: logicalDate } = shiftService.getLogicalShiftInfo(new Date())
          const info = shiftService.calculateShift(logicalDate, currentSession.groupName, config)
          setShiftInfo(info)
        }
      }
    }
    loadShiftInfo()
  }, [currentSession])

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
        {/* Handover Banner */}
        {nextSession && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-4 text-white shadow-md animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-full animate-pulse">
                  <RefreshCw className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">교대 근무 진행 중</h3>
                  <p className="text-indigo-100 text-sm">
                    현재 <strong>{currentSession?.groupName}</strong>에서 <strong>{nextSession.groupName}</strong>로 업무 인수인계가 진행 중입니다.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs text-indigo-200">다음 근무 조</p>
                  <p className="font-bold">{nextSession.groupName}</p>
                </div>
                <Button
                  variant="secondary"
                  className="bg-white text-indigo-600 hover:bg-indigo-50"
                  onClick={() => router.push('/worklog')}
                >
                  업무일지 바로가기
                </Button>
              </div>
            </div>
          </div>
        )}

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

        {/* Unified Status Card */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {/* Header Section */}
            <div className="flex items-center justify-between p-4 pb-3 border-b">
              {/* Left: Group & Status */}
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold">
                  {currentSession?.groupName || "근무 없음"}
                  {shiftInfo && (
                    <span className={`ml-2 ${shiftInfo.shiftType === 'N' ? 'text-indigo-500' : 'text-orange-500'}`}>
                      ({shiftInfo.shiftType === 'A' ? '주간' : shiftInfo.shiftType === 'N' ? '야간' : shiftInfo.shiftType})
                    </span>
                  )}
                </div>
                {currentSession && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse" />
                    근무중
                  </Badge>
                )}
              </div>

              {/* Center: Flip Calendar with Weather Popover */}
              {currentSession && (
                <Popover onOpenChange={(open) => open && fetchWeather()}>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity focus:outline-none">
                      {(() => {
                        const now = new Date()
                        const month = now.getMonth() + 1
                        const day = now.getDate()
                        const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][now.getDay()]
                        const isWeekend = now.getDay() === 0 || now.getDay() === 6

                        return (
                          <>
                            {/* Month Block */}
                            <div className="flex flex-col items-center bg-primary text-primary-foreground rounded shadow-md overflow-hidden min-w-[44px]">
                              <div className="w-full h-1.5 bg-primary-foreground/20 flex justify-center gap-1 pt-0.5">
                                <span className="w-1 h-1 bg-primary-foreground/40 rounded-full" />
                                <span className="w-1 h-1 bg-primary-foreground/40 rounded-full" />
                              </div>
                              <span className="text-lg font-bold leading-tight pt-0.5">{month}</span>
                              <span className="text-[10px] uppercase pb-1 opacity-80">
                                {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][now.getMonth()]}
                              </span>
                            </div>
                            {/* Day Block */}
                            <div className="flex flex-col items-center bg-white dark:bg-zinc-800 border rounded shadow-md overflow-hidden min-w-[44px]">
                              <div className="w-full h-1.5 bg-muted flex justify-center gap-1 pt-0.5">
                                <span className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
                                <span className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
                              </div>
                              <span className="text-2xl font-bold leading-tight pt-0.5">{day}</span>
                              <span className="text-[10px] pb-1 text-muted-foreground">일</span>
                            </div>
                            {/* Day of Week Block */}
                            <div className={`flex flex-col items-center rounded shadow-md overflow-hidden min-w-[44px] ${isWeekend ? 'bg-red-500 text-white' : 'bg-white dark:bg-zinc-800 border'}`}>
                              <div className={`w-full h-1.5 flex justify-center gap-1 pt-0.5 ${isWeekend ? 'bg-red-400' : 'bg-muted'}`}>
                                <span className={`w-1 h-1 rounded-full ${isWeekend ? 'bg-white/40' : 'bg-muted-foreground/30'}`} />
                                <span className={`w-1 h-1 rounded-full ${isWeekend ? 'bg-white/40' : 'bg-muted-foreground/30'}`} />
                              </div>
                              <span className={`text-lg font-bold leading-tight pt-1 ${isWeekend ? '' : 'text-foreground'}`}>{dayOfWeek}</span>
                              <span className={`text-[10px] uppercase pb-1 ${isWeekend ? 'opacity-80' : 'text-muted-foreground'}`}>
                                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][now.getDay()]}
                              </span>
                            </div>
                          </>
                        )
                      })()}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72" align="center">
                    {/* Time & Date Header - Digital Clock Style */}
                    <div className="text-center pb-3 border-b">
                      <div className="font-mono text-4xl font-bold tracking-wider">
                        {new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      </div>
                      <div className="flex items-center justify-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span>{new Date().getFullYear()}.{String(new Date().getMonth() + 1).padStart(2, '0')}.{String(new Date().getDate()).padStart(2, '0')}</span>
                        <span className="text-xs px-1.5 py-0.5 bg-muted rounded">
                          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][new Date().getDay()]}
                        </span>
                      </div>
                    </div>

                    {/* Weather Section */}
                    <div className="py-3 border-b">
                      {weatherLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
                        </div>
                      ) : weather ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-3xl">{weather.emoji}</span>
                              <span className="font-medium">{weather.description}</span>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold">{weather.temp}°C</p>
                              <p className="text-xs text-muted-foreground">
                                {weather.tempMin}° / {weather.tempMax}°
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-center gap-6 text-sm pt-2">
                            <div className="flex items-center gap-1.5">
                              <Sunrise className="h-4 w-4 text-orange-500" />
                              <span>일출 {weather.sunrise}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Sunset className="h-4 w-4 text-indigo-500" />
                              <span>일몰 {weather.sunset}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-sm text-muted-foreground">
                          <CloudSun className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          날씨 정보를 불러올 수 없습니다
                        </div>
                      )}
                    </div>

                    {/* Shift Time Section */}
                    <div className="pt-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🌅</span>
                        <span className="text-sm">주간: 07:30 ~ 19:00</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🌙</span>
                        <span className="text-sm">야간: 19:00 ~ 07:30</span>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* Right: Time Info + Action */}
              {currentSession && shiftInfo && (
                <div className="flex flex-col items-end gap-1">
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => {
                    if (currentLog) {
                      router.push(`/worklog?id=${currentLog.id}`)
                    } else {
                      router.push('/worklog')
                    }
                  }}>
                    오늘 업무일지 가기
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{shiftInfo.shiftType === 'A' ? '07:30 ~ 19:00' : '19:00 ~ 07:30'}</span>
                    <span className="text-muted-foreground/50">|</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {(() => {
                        const now = new Date()
                        const endHour = shiftInfo.shiftType === 'A' ? 19 : 7
                        const endTime = new Date()
                        endTime.setHours(endHour, 0, 0, 0)
                        if (shiftInfo.shiftType === 'N' && now.getHours() >= 19) {
                          endTime.setDate(endTime.getDate() + 1)
                        }
                        const diffMs = endTime.getTime() - now.getTime()
                        if (diffMs <= 0) return '근무 종료'
                        const diffMins = Math.floor(diffMs / 60000)
                        const hours = Math.floor(diffMins / 60)
                        const mins = diffMins % 60
                        return `${hours}h ${mins}m 남음`
                      })()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Members Section */}
            {currentSession && (
              <div className="px-4 py-3 border-b bg-muted/30">
                <div className="flex items-center justify-center gap-4 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  {(() => {
                    const roleOrder = ['감독', '부감독', '영상']
                    const sortedMembers = [...currentSession.members].sort((a, b) => {
                      return roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role)
                    })
                    return sortedMembers.map((member, idx) => (
                      <span key={member.id} className="font-medium">
                        {member.name}
                        <span className="text-muted-foreground">({member.role})</span>
                        {idx < sortedMembers.length - 1 && <span className="text-muted-foreground ml-2">·</span>}
                      </span>
                    ))
                  })()}
                </div>
              </div>
            )}

            {/* Stats Section */}
            <div className="p-4 space-y-4">
              {/* 운행표 */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-20 text-sm">
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                  <span>운행표</span>
                </div>
                <div className="flex-1">
                  <Progress value={80} className="h-2" />
                </div>
                <span className="text-sm font-medium w-12 text-right">4/5</span>
              </div>

              {/* 이슈 */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-20 text-sm">
                  <AlertCircle className={`h-4 w-4 ${emergencyPosts.length > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
                  <span>이슈</span>
                </div>
                <div className="flex-1">
                  <Progress
                    value={emergencyPosts.length > 0 ? 100 : 0}
                    className={`h-2 ${emergencyPosts.length > 0 ? '[&>div]:bg-destructive' : ''}`}
                  />
                </div>
                <span className={`text-sm font-medium w-12 text-right ${emergencyPosts.length > 0 ? 'text-destructive' : ''}`}>
                  {emergencyPosts.length}건
                </span>
              </div>

              {/* 서명 */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-20 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <span>서명</span>
                </div>
                <div className="flex-1">
                  <Progress value={currentLog ? (signatureProgress / 4) * 100 : 0} className="h-2" />
                </div>
                <span className="text-sm font-medium w-12 text-right">
                  {currentLog ? `${signatureProgress}/4` : '0/4'}
                </span>
              </div>
            </div>

          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>최근 포스트</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {posts.slice(0, 3).map(post => (
                  <div key={post.id} className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{post.category?.name || "일반"}</Badge>
                        <span className="font-medium text-sm line-clamp-1">{post.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {post.summary || "내용 없음"}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
                {posts.length === 0 && (
                  <div className="text-center text-sm text-muted-foreground py-4">
                    작성된 포스트가 없습니다.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>업무확인 서명</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Current Worklog Signatures */}
                {currentLog ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-muted-foreground">현재 근무 ({currentLog.groupName} {currentLog.type})</h4>
                      <Link href={`/worklog?id=${currentLog.id}`} className="text-xs text-blue-600 hover:underline">
                        상세보기
                      </Link>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'operation', label: '운행' },
                        { key: 'team_leader', label: '팀장' },
                        { key: 'mcr', label: 'MCR' },
                        { key: 'network', label: 'Net' },
                      ].map(item => {
                        const sigData = parseSignature(currentLog.signatures?.[item.key as keyof typeof currentLog.signatures] || null)
                        return (
                          <div key={item.key} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded border">
                            {sigData ? (
                              <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                            ) : (
                              <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                            <div className="flex flex-col min-w-0">
                              <span className="font-medium text-xs text-muted-foreground">{item.label}</span>
                              <span className="text-xs truncate font-bold">
                                {sigData ? sigData.name : "대기"}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground bg-muted/50 rounded-lg">
                    진행 중인 업무일지가 없습니다.
                  </div>
                )}

                {/* Previous Worklog Signatures */}
                {previousLog && (
                  <>
                    <div className="h-px bg-border my-2" />
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-muted-foreground">이전 근무 ({previousLog.groupName} {previousLog.type})</h4>
                        <Link href={`/worklog?id=${previousLog.id}`} className="text-xs text-blue-600 hover:underline">
                          상세보기
                        </Link>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { key: 'operation', label: '운행' },
                          { key: 'team_leader', label: '팀장' },
                          { key: 'mcr', label: 'MCR' },
                          { key: 'network', label: 'Net' },
                        ].map(item => {
                          // Use type assertion carefully or defined type
                          const sigData = parseSignature(previousLog.signatures?.[item.key as keyof typeof previousLog.signatures] || null)
                          return (
                            <div key={item.key} className="flex items-center gap-2 text-sm p-2 bg-muted/50 rounded border">
                              {sigData ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                              ) : (
                                <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                              )}
                              <div className="flex flex-col min-w-0">
                                <span className="font-medium text-xs text-muted-foreground">{item.label}</span>
                                <span className="text-xs truncate font-bold">
                                  {sigData ? sigData.name : "대기"}
                                </span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
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
                          <Badge variant="outline" className="text-xs">{log.groupName}</Badge>
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

        {/* Post Editor Dialog */}
        <Dialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>새 이슈/공지 등록</DialogTitle>
              <DialogDescription>
                업무 관련 이슈나 공지사항을 등록해주세요.
              </DialogDescription>
            </DialogHeader>
            <PostEditor onSuccess={() => {
              setPostDialogOpen(false)
              fetchPosts({ priority: '긴급' })
            }} />
          </DialogContent>
        </Dialog>

        {/* Handover Login Dialog */}
        <Dialog open={handoverDialogOpen} onOpenChange={(open) => {
          setHandoverDialogOpen(open)
          if (!open) {
            // Reset state on close
            setTimeout(() => {
              setHandoverStep('login')
              setHandoverData(null)
            }, 300)
          }
        }}>
          <DialogContent className="sm:max-w-[425px]">
            {handoverStep === 'login' ? (
              <>
                <DialogHeader>
                  <DialogTitle>교대 근무자 로그인</DialogTitle>
                  <DialogDescription>
                    다음 근무 조의 계정으로 로그인해주세요. 현재 세션은 유지됩니다.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <LoginForm
                    mode="handover"
                    onSuccess={handleHandoverLoginSuccess}
                  />
                </div>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>근무 세션 설정</DialogTitle>
                  <DialogDescription>
                    참여 근무자를 확인하고 교대를 완료해주세요.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <SessionSetupStep
                    groupName={handoverData?.groupData?.name || ""}
                    initialMembers={handoverData?.initialMembers || []}
                    onConfirm={handleHandoverComplete}
                    onCancel={() => setHandoverStep('login')}
                    confirmLabel="교대 근무자 확정"
                  />
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
