"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

import { MainLayout } from "@/components/layout/main-layout"

export default function DailyLogPage() {
  const [date, setDate] = useState<string>("")

  useEffect(() => {
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

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-100 p-4 print:bg-white print:p-0">
        <div className="mx-auto max-w-[210mm] print:max-w-none">
          {/* Print Button - Hidden in print mode */}
          <div className="mb-4 flex justify-end print:hidden">
            <Button onClick={handlePrint} className="flex items-center gap-2">
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
              <div className="text-lg">{date}</div>
              <div className="w-[140px]"></div> {/* Spacer for balance */}
            </div>

            {/* Shift Table */}
            <div className="mb-4 flex w-full gap-0">
              {/* Shift Table */}
              <table className="flex-1 border-collapse border border-black text-center text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="w-1/4 border border-black py-1">야간근무시간</th>
                    <th className="w-1/4 border border-black py-1">감 독</th>
                    <th className="w-1/4 border border-black py-1">부 감 독</th>
                    <th className="w-1/4 border border-black py-1">영 상</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-black py-4">18:30 ~ 08:00</td>
                    <td className="border border-black py-4 font-handwriting text-lg">김희성</td>
                    <td className="border border-black py-4 font-handwriting text-lg">임양빈</td>
                    <td className="border border-black py-4 font-handwriting text-lg">김도희</td>
                  </tr>
                </tbody>
              </table>

              {/* Updated Approval Box */}
              <div className="ml-[-1px] flex w-[140px] border border-black">
                <div className="flex flex-1 flex-col border-r border-black">
                  <div className="bg-gray-100 py-1 text-center text-sm font-bold border-b border-black">운 행</div>
                  <div className="flex-1 border-b border-black min-h-[50px]"></div>
                  <div className="bg-white py-1 text-center text-sm font-bold border-b border-black">MCR</div>
                  <div className="flex-1 min-h-[50px]"></div>
                </div>
                <div className="flex flex-1 flex-col">
                  <div className="bg-gray-100 py-1 text-center text-sm font-bold border-b border-black">팀 장</div>
                  <div className="flex-1 border-b border-black min-h-[50px]"></div>
                  <div className="bg-white py-1 text-center text-sm font-bold border-b border-black">Network</div>
                  <div className="flex-1 min-h-[50px]"></div>
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
                  ></textarea>
                </div>
                <div className="flex-1">
                  <textarea
                    className="h-full w-full resize-none p-2 text-sm outline-none"
                    placeholder="DRAMA 내용..."
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
                  ></textarea>
                </div>
                <div className="flex-1">
                  <textarea
                    className="h-full w-full resize-none p-2 text-sm outline-none"
                    placeholder="ON 내용..."
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
