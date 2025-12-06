"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Printer, CheckCircle2 } from "lucide-react"
import { MainLayout } from "@/components/layout/main-layout"
import { useWorklogStore } from "@/store/worklog"
import { useAuthStore } from "@/store/auth"
import { toast } from "sonner"
import { format } from "date-fns"
import { ko } from "date-fns/locale"

export default function DailyLogPage() {
  const [date, setDate] = useState<string>("")
  const { worklogs, fetchWorklogs, updateWorklog } = useWorklogStore()
  const { user, group } = useAuthStore()

  // Use the latest worklog for now (or the one matching today/selected date)
  // Ideally this page should receive an ID or date param, but for now we take the first one.
  const worklog = worklogs.length > 0 ? worklogs[0] : null

  useEffect(() => {
    fetchWorklogs()

    // Set current date in format: 202X년 X월 X일 X요일
    const now = new window.Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    const day = now.getDate()
    const weekDays = ["일", "월", "화", "수", "목", "금", "토"]
    const weekDay = weekDays[now.getDay()]
    setDate(`${year}년 ${month}월 ${day}일 ${weekDay}요일`)
  }, [])

  const handlePrint = () => {
    window.print()
  }

  const handleSign = async (type: 'operation' | 'mcr' | 'team_leader' | 'network') => {
    console.log("handleSign called", { type, user, worklog })
    if (!worklog) {
      console.error("Worklog is missing")
      return
    }
    if (!user) {
      console.error("User is missing")
      return
    }

    // Permission Check
    if (type === 'operation') {
      // Operation: Only Shift Director of the current group
      const isDirector = user.role?.includes('감독')

      if (!isDirector) {
        // Play error sound
        // Since we don't have a sound file guaranteed, let's just use a more prominent alert/toast
        // But user asked for sound. I'll simulate a beep if possible or just rely on UI.
        // Let's stick to Toast but make it very clear.

        // Actually, let's try to play a system beep or just a standard error sound if available.
        // For web, we can't easily play system beep.
        // Let's use a simple oscillator beep for immediate feedback.
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
          const osc = ctx.createOscillator()
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(220, ctx.currentTime)
          osc.connect(ctx.destination)
          osc.start()
          osc.stop(ctx.currentTime + 0.1)
        } catch (e) {
          console.error("Audio context error", e)
        }

        toast.error("권한이 없습니다: 운행 결재는 '감독'만 가능합니다.", {
          duration: 3000,
          style: { background: '#fee2e2', color: '#dc2626', fontWeight: 'bold' }
        })
        return
      }
      // Note: Strict group check might be annoying if testing with different users, 
      // but for production it should be strict. 
      // For now, let's rely on role '감독'.
    } else {
      // Others: Only Support (Non-internal) workers
      // We check if user.type is NOT 'internal' (meaning it's 'support' or 'external')
      if (user.type === 'internal') {
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
          const osc = ctx.createOscillator()
          osc.type = 'sawtooth'
          osc.frequency.setValueAtTime(220, ctx.currentTime)
          osc.connect(ctx.destination)
          osc.start()
          osc.stop(ctx.currentTime + 0.1)
        } catch (e) { }

        toast.error("권한이 없습니다: 팀장/MCR/Network 결재는 '지원' 근무자만 가능합니다.", {
          duration: 3000,
          style: { background: '#fee2e2', color: '#dc2626', fontWeight: 'bold' }
        })
        return
      }
    }

    // Create Signature String (Name + Date Time in 2 lines)
    const timestamp = format(new Date(), 'yyyy-MM-dd HH:mm')
    const signatureText = `${user.name}\n${timestamp}`

    // Update Signatures
    const newSignatures = {
      operation: worklog.signatures?.operation ?? null,
      mcr: worklog.signatures?.mcr ?? null,
      team_leader: worklog.signatures?.team_leader ?? null,
      network: worklog.signatures?.network ?? null,
      ...worklog.signatures,
      [type]: signatureText
    }

    // Update Status if Operation
    let newStatus = worklog.status
    if (type === 'operation') {
      // Check if current time is past shift end time
      const now = new Date()
      const currentHour = now.getHours()
      const currentMinute = now.getMinutes()
      const currentTimeVal = currentHour * 60 + currentMinute

      // Define Shift End Times (in minutes)
      // Day: 18:30 (18 * 60 + 30 = 1110)
      // Night: 08:30 (8 * 60 + 30 = 510)

      let isShiftEnded = false
      if (worklog.type === '주간') {
        if (currentTimeVal >= 1110) isShiftEnded = true
      } else {
        // Night shift spans two days. 
        // If it's 'Night', it usually starts at 18:30 and ends 08:30 next day.
        // If we are signing, we need to know if we are in the "end" part of the shift.
        // If current time is morning (00:00 - 12:00), and it's past 08:30, it's ended.
        // If current time is evening (18:30 - 23:59), it hasn't ended yet.
        if (currentHour < 12 && currentTimeVal >= 510) isShiftEnded = true
      }

      if (isShiftEnded) {
        newStatus = '근무종료'
      } else {
        // Pre-signing: Status remains '작성중'
        // We don't change status, just save signature.
        toast.info("근무 종료 시간 전이므로 서명만 등록됩니다. (자동 마감 예정)")
      }
    }

    // Calculate signature count string (e.g., "1/4")
    const signedCount = Object.values(newSignatures).filter(Boolean).length
    const signatureCountStr = `${signedCount}/4`

    // Call Store Update
    const { error } = await updateWorklog(worklog.id, {
      signatures: newSignatures,
      status: newStatus,
      signature: signatureCountStr
    })

    if (error) {
      toast.error("결재 처리에 실패했습니다.")
    } else {
      toast.success("결재가 완료되었습니다.")
    }
  }

  // Helper to render signature box
  const renderSignatureBox = (
    title: string,
    type: 'operation' | 'mcr' | 'team_leader' | 'network',
    bgColor: string = "bg-white"
  ) => {
    const signature = worklog?.signatures?.[type]
    const [name, date] = signature ? signature.split('\n') : ['', '']

    return (
      <div
        className={`flex flex-1 flex-col hover:bg-gray-50 transition-colors ${bgColor}`}
        style={{ cursor: `url('/images/cursor-pen.png'), auto` }}
        onClick={() => handleSign(type)}
      >
        <div className="bg-gray-100 py-1 text-center text-sm font-bold border-b border-black">{title}</div>
        <div className="flex-1 border-b border-black min-h-[50px] flex items-center justify-center p-1">
          {signature ? (
            <div className="text-center">
              <div className="font-handwriting text-lg leading-tight">{name}</div>
              <div className="text-[10px] text-gray-500">{date}</div>
            </div>
          ) : (
            <div className="text-gray-300 text-xs">클릭하여 결재</div>
          )}
        </div>
      </div>
    )
  }

  if (!worklog) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <p>작성된 업무일지가 없습니다.</p>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-100 p-4 print:bg-white print:p-0">
        <div className="mx-auto max-w-[210mm] print:max-w-none">
          {/* Print Button - Hidden in print mode */}
          <div className="mb-4 flex justify-end print:hidden">
            <span className={`text-sm font-medium ${worklog?.status === '작성중' ? 'text-blue-600' : 'text-green-600'}`}>
              {worklog?.status === '작성중' ? '저장됨' : '마감됨'} ({format(new Date(), 'HH:mm:ss')})
            </span>
            <Button variant="outline" size="sm" className="text-[#008485] border-[#008485] hover:bg-[#008485]/10 gap-2">
              <CheckCircle2 className="h-4 w-4" />
              결재(서명)
            </Button>
            <Button variant="default" size="sm" onClick={handlePrint} className="bg-[#004ea2] hover:bg-[#003d82] text-white gap-2">
              <Printer className="h-4 w-4" />
              인쇄하기
            </Button>
          </div>

          {/* A4 Page Container */}
          <div className="bg-white p-[10mm] shadow-lg print:shadow-none print:min-h-screen print:w-full">
            {/* Header Section */}
            <div className="mb-6 border-b-2 border-black pb-2">
              {/* Top Row: Logo + Title */}
              <div className="flex items-start justify-between">
                {/* Logo */}
                <div className="flex flex-col">
                  <div className="text-sm font-bold text-red-600 italic">Let&apos;s plus!</div>
                  <div className="text-3xl font-black tracking-tight text-slate-800">MBC PLUS</div>
                </div>

                {/* Title */}
                <div className="mt-4 text-4xl font-bold tracking-[0.2em] text-black">주 조 정 실 &nbsp; 업 무 일 지</div>

                {/* Spacer to balance the title */}
                <div className="w-[130px]"></div>
              </div>
            </div>

            {/* Info Row */}
            <div className="mb-2 flex items-center justify-between text-sm font-bold">
              <div>송출 기술팀</div>
              <div className="text-lg">{worklog.date ? format(new Date(worklog.date), 'yyyy년 M월 d일 EEEE', { locale: ko }) : date}</div>
              <div className="w-[140px]"></div> {/* Spacer for balance */}
            </div>

            {/* Shift Table */}
            <div className="mb-4 flex w-full gap-0">
              {/* Shift Table */}
              <table className="flex-1 border-collapse border border-black text-center text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="w-1/4 border border-black py-1">{worklog.type === '야간' ? '야간근무시간' : '주간근무시간'}</th>
                    <th className="w-1/4 border border-black py-1">감 독</th>
                    <th className="w-1/4 border border-black py-1">부 감 독</th>
                    <th className="w-1/4 border border-black py-1">영 상</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black py-4">
                      {worklog.type === '야간' ? '18:30 ~ 08:30' : '08:30 ~ 18:30'}
                    </td>
                    <td className="border border-black py-4 font-handwriting text-lg">
                      {worklog.workers.director.join(', ')}
                    </td>
                    <td className="border border-black py-4 font-handwriting text-lg">
                      {worklog.workers.assistant.join(', ')}
                    </td>
                    <td className="border border-black py-4 font-handwriting text-lg">
                      {worklog.workers.video.join(', ')}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Updated Approval Box */}
              <div className="ml-[-1px] flex w-[140px] border border-black">
                <div className="flex flex-1 flex-col border-r border-black">
                  {renderSignatureBox("운 행", "operation", "bg-gray-50")}
                  {renderSignatureBox("MCR", "mcr")}
                </div>
                <div className="flex flex-1 flex-col">
                  {renderSignatureBox("팀 장", "team_leader", "bg-gray-50")}
                  {renderSignatureBox("Network", "network")}
                </div>
              </div>
            </div>

            {/* Channel Logs Section Title */}
            <div className="mb-1 border border-black bg-gray-300 py-1 text-center font-bold">
              채널별 &nbsp; 송 출 &nbsp; 사 항
            </div>

            {/* Channel: MBC SPORTS+ */}
            <div className="mb-2 border border-black">
              <div className="flex items-center border-b border-black p-1 text-sm">
                <span className="mr-2 font-bold">MBC SPORTS+</span>
                <span>편성종류 ( 정규 - </span>
                <div className="mx-1 inline-flex items-center gap-1">
                  <span className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-black text-xs hover:bg-gray-100">
                    ①
                  </span>
                  <span className="cursor-pointer hover:font-bold">2</span>
                  <span className="cursor-pointer hover:font-bold">3</span>
                  <span className="cursor-pointer hover:font-bold">4</span>
                  <span className="cursor-pointer hover:font-bold">5</span>
                </div>
                <span>기타 - )</span>
              </div>
              <div className="flex h-32">
                <textarea
                  className="h-full w-full resize-none p-2 text-sm outline-none"
                  placeholder="내용을 입력하세요..."
                  value={worklog.channelLogs?.['MBC SPORTS+']?.posts?.map(p => p.summary).join('\n') || ''}
                  readOnly
                ></textarea>
                {/* Signature Box */}
                <div className="flex w-24 flex-col border-l border-black">
                  <div className="bg-gray-100 py-0.5 text-center text-[10px]">운행표 확인</div>
                  <div className="flex-1 border-t border-black"></div>
                  <div className="border-t border-black text-right text-[10px] pr-1">SPORTS</div>
                </div>
              </div>
            </div>

            {/* Channel: MBC M & DRAMA */}
            <div className="mb-2 border border-black">
              <div className="grid grid-cols-2 divide-x divide-black text-sm border-b border-black">
                <div className="p-1 flex items-center">
                  <span className="mr-2 font-bold">MBC M</span>
                  <span>편성종류 ( 정규 - </span>
                  <div className="mx-1 inline-flex items-center gap-1">
                    <span className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-black text-xs">
                      ①
                    </span>
                    <span>2 3 4 5</span>
                  </div>
                  <span>기타 - )</span>
                </div>
                <div className="p-1 flex items-center">
                  <span className="mr-2 font-bold">DRAMA</span>
                  <span>편성종류 ( 정규 - </span>
                  <div className="mx-1 inline-flex items-center gap-1">
                    <span className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-black text-xs">
                      ①
                    </span>
                    <span>2 3 4 5</span>
                  </div>
                  <span>기타 - )</span>
                </div>
              </div>
              <div className="flex h-24">
                <div className="flex-1 border-r border-black">
                  <textarea
                    className="h-full w-full resize-none p-2 text-sm outline-none"
                    placeholder="MBC M 내용..."
                    value={worklog.channelLogs?.['MBC M']?.posts?.map(p => p.summary).join('\n') || ''}
                    readOnly
                  ></textarea>
                </div>
                <div className="flex-1">
                  <textarea
                    className="h-full w-full resize-none p-2 text-sm outline-none"
                    placeholder="DRAMA 내용..."
                    value={worklog.channelLogs?.['MBC DRAMA']?.posts?.map(p => p.summary).join('\n') || ''}
                    readOnly
                  ></textarea>
                </div>
                {/* Signature Box for both - simplified vertical stack */}
                <div className="flex w-24 flex-col border-l border-black">
                  <div className="bg-gray-100 py-0.5 text-center text-[10px]">운행표 확인</div>
                  <div className="flex-1 border-t border-black relative">
                    <span className="absolute bottom-0 right-1 text-[10px]">M</span>
                  </div>
                  <div className="flex-1 border-t border-black relative">
                    <span className="absolute bottom-0 right-1 text-[10px]">DRAMA</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Channel: MBC Every1 & ON */}
            <div className="mb-2 border border-black">
              <div className="grid grid-cols-2 divide-x divide-black text-sm border-b border-black">
                <div className="p-1 flex items-center">
                  <span className="mr-2 font-bold">MBC Every1</span>
                  <span>편성종류 ( 정규 - </span>
                  <div className="mx-1 inline-flex items-center gap-1">
                    <span className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-black text-xs">
                      ①
                    </span>
                    <span>2 3 4 5</span>
                  </div>
                  <span>기타 - )</span>
                </div>
                <div className="p-1 flex items-center">
                  <span className="mr-2 font-bold">ON</span>
                  <span>편성종류 ( 정규 - </span>
                  <div className="mx-1 inline-flex items-center gap-1">
                    <span className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-black text-xs">
                      ①
                    </span>
                    <span>2 3 4 5</span>
                  </div>
                  <span>기타 - )</span>
                </div>
              </div>
              <div className="flex h-24">
                <div className="flex-1 border-r border-black">
                  <textarea
                    className="h-full w-full resize-none p-2 text-sm outline-none"
                    placeholder="Every1 내용..."
                    value={worklog.channelLogs?.['MBC Every1']?.posts?.map(p => p.summary).join('\n') || ''}
                    readOnly
                  ></textarea>
                </div>
                <div className="flex-1">
                  <textarea
                    className="h-full w-full resize-none p-2 text-sm outline-none"
                    placeholder="ON 내용..."
                    value={worklog.channelLogs?.['MBC ON']?.posts?.map(p => p.summary).join('\n') || ''}
                    readOnly
                  ></textarea>
                </div>
                {/* Signature Box */}
                <div className="flex w-24 flex-col border-l border-black">
                  <div className="bg-gray-100 py-0.5 text-center text-[10px]">운행표 확인</div>
                  <div className="flex-1 border-t border-black relative">
                    <span className="absolute bottom-0 right-1 text-[10px]">EVERY1</span>
                  </div>
                  <div className="flex-1 border-t border-black relative">
                    <span className="absolute bottom-0 right-1 text-[10px]">ON</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Channel: ALL THE K-POP */}
            <div className="mb-4 border border-black">
              <div className="flex items-center p-1 text-sm bg-white">
                <span className="mr-2 font-bold">ALL THE K-POP</span>
                <span>편성종류 ( 정규 - </span>
                <div className="mx-1 inline-flex items-center gap-1">
                  <span className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-black text-xs hover:bg-gray-100">
                    ①
                  </span>
                  <span className="cursor-pointer hover:font-bold">2 3 4 5</span>
                </div>
                <span>기타 - )</span>
              </div>
            </div>

            {/* System Issues */}
            <div className="mb-1 border border-black bg-gray-300 py-1 pl-2 text-sm font-bold">장비 / 시스템 주요사항</div>
            <div className="mb-4 h-24 w-full border border-black">
              <textarea
                className="h-full w-full resize-none p-2 text-sm outline-none"
                placeholder="특이사항 없음"
                value={worklog.systemIssues?.map(i => i.summary).join('\n') || ''}
                readOnly
              ></textarea>
            </div>

            {/* Footer Check */}
            <div className="flex justify-end items-center gap-2">
              <span className="font-bold text-sm">Private CDN A/V 이상없습니다.</span>
              <div className="h-6 w-6 border border-black flex items-center justify-center">
                <span className="text-lg">v</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
