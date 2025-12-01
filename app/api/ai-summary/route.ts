import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
    console.log('=== AI Summary API Called (Gemini) ===')
    try {
        const { worklog } = await request.json()

        // 입력 검증
        if (!worklog || !worklog.date) {
            return NextResponse.json(
                { error: '업무일지 데이터가 없습니다.' },
                { status: 400 }
            )
        }

        const apiKey = process.env.GOOGLE_API_KEY
        if (!apiKey) {
            console.error('ERROR: GOOGLE_API_KEY is not set')
            return NextResponse.json(
                { error: 'Google API key is not configured' },
                { status: 500 }
            )
        }

        const workers = [
            ...(worklog.workers?.director || []),
            ...(worklog.workers?.assistant || []),
            ...(worklog.workers?.video || [])
        ].filter(Boolean).join(', ')

        const TARGET_CHANNELS = ['MBC SPORTS+', 'MBC DRAMA', 'MBC Every1', 'MBC M', 'MBC ON']

        const channelSummaries = TARGET_CHANNELS.map(channel => {
            const data = worklog.channelLogs?.[channel]
            const posts = data?.posts?.map((p: any) => `- ${p.summary}`).join('\n') || '특이사항 없음'
            return `${channel}:\n${posts}`
        }).join('\n\n')

        const systemIssuesSummary = worklog.systemIssues?.length > 0
            ? worklog.systemIssues.map((issue: any) => `- ${issue.summary}`).join('\n')
            : '없음'

        const prompt = `당신은 방송국 주조정실 업무 전문가입니다. 아래 업무일지를 요약하세요.

[업무일지 정보]
- 날짜: ${worklog.date}
- 근무: ${worklog.groupName} ${worklog.type}
- 근무자: ${workers || '미지정'}

[채널별 송출내역]
${channelSummaries || '없음'}

[시스템 이슈]
${systemIssuesSummary}

[요약 규칙]
1. 핵심 사항만 간결하게 작성
2. **채널명은 약어를 사용하지 않고 풀네임(MBC SPORTS+, MBC DRAMA, MBC Every1, MBC M, MBC ON)을 사용할 것**
3. **모든 채널의 송출 현황을 빠짐없이 작성할 것**
4. 특이사항이 없으면 "정상 운행"으로 표기
5. 존댓말 사용 금지, 개조식으로 작성
6. **문장을 완결지을 것**

[출력 형식]
근무개요: (1줄)
송출현황: (모든 채널의 현황을 각각 작성)
장비 및 시스템 주요사항: (내용이 없으면 "특이사항 없음"으로 작성)`

        console.log('Calling Gemini API...')

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

        let summary = ''
        let retryCount = 0
        const maxRetries = 3

        while (retryCount < maxRetries) {
            try {
                const result = await model.generateContent(prompt)
                const response = await result.response
                summary = response.text().trim()
                break
            } catch (error: any) {
                if (error.message?.includes('429') || error.status === 429) {
                    retryCount++
                    console.log(`Rate limited (429). Retrying... (${retryCount}/${maxRetries})`)
                    if (retryCount === maxRetries) throw error

                    const match = error.message?.match(/retryDelay":"([\d\.]+)s"/)
                    const delaySeconds = match ? parseFloat(match[1]) : 10
                    const waitTime = Math.ceil(delaySeconds * 1000) + 1000

                    console.log(`Waiting ${waitTime}ms before retry...`)
                    await new Promise(resolve => setTimeout(resolve, waitTime))
                } else {
                    throw error
                }
            }
        }

        console.log('Generated summary:', summary)
        return NextResponse.json({ summary })

    } catch (error) {
        console.error('=== AI Summary Error ===')
        console.error('Error:', error)

        return NextResponse.json(
            {
                error: 'AI 요약 생성 실패',
                fallbackSummary: 'AI 요약을 사용할 수 없습니다. 잠시 후 다시 시도해주세요.',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        )
    }
}