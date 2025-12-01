import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

export async function POST(request: NextRequest) {
    console.log('=== Post Summary API Called (Gemini) ===')
    try {
        const { content, title, category } = await request.json()
        console.log('Request data:', { title, category, contentLength: content?.length })

        // HTML 태그 제거 및 텍스트 정리
        const plainText = content
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()

        console.log('Plain text length:', plainText.length)

        if (!plainText || plainText.length < 10) {
            console.error('Content too short:', plainText.length)
            return NextResponse.json(
                { error: '요약할 내용이 너무 짧습니다.' },
                { status: 400 }
            )
        }

        // Check API key
        const apiKey = process.env.GOOGLE_API_KEY
        if (!apiKey) {
            console.error('ERROR: GOOGLE_API_KEY is not set')
            return NextResponse.json(
                { error: 'Google API key is not configured' },
                { status: 500 }
            )
        }
        console.log('API Key starts with:', apiKey.substring(0, 4) + '...')

        // ✅ 개선된 프롬프트 (JSON 출력 요청)
        const prompt = `당신은 방송국 업무일지 요약 전문가입니다.

[작업]
아래 본문을 읽고, 다음 두 가지를 생성하세요:
1. **summary**: 업무일지용 요약 (공백 포함 50자 이내)
2. **title**: 포스트 제목용 요약 (공백 포함 30자 이내)

[제목] ${title || '없음'}
[카테고리] ${category || '일반'}

[본문]
${plainText.substring(0, 1500)}

[요약 규칙]
- 반드시 본문 전체의 핵심 주제를 파악하여 요약
- 본문의 첫 문장을 그대로 복사하지 말 것
- "~에 대한 내용" 또는 "~를 다룸" 형식으로 작성
- **summary는 50자 이내, title은 30자 이내로 엄격히 제한**
- **반드시 JSON 형식으로 출력할 것**
- 예시:
{
  "summary": "일본 예능 방송 장르가 한국에 미친 영향과 변천사를 분석",
  "title": "일본 예능이 한국에 미친 영향 분석"
}

[출력 결과 (JSON)]`

        console.log('Calling Gemini API...')

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash', generationConfig: { responseMimeType: "application/json" } })

        let resultData = { summary: '', title: '' }
        let retryCount = 0
        const maxRetries = 3

        while (retryCount < maxRetries) {
            try {
                const result = await model.generateContent(prompt)
                const response = await result.response
                let text = response.text().trim()

                // Remove markdown code blocks if present
                if (text.startsWith('```')) {
                    text = text.replace(/^```(json)?\n/, '').replace(/\n```$/, '')
                }

                resultData = JSON.parse(text)
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

        console.log('Generated summary:', resultData)
        return NextResponse.json(resultData)

    } catch (error) {
        console.error('=== Post Summary Error ===')
        console.error('Error:', error)

        return NextResponse.json(
            {
                error: 'AI 요약 생성 실패',
                fallbackSummary: '요약을 생성할 수 없습니다.',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        )
    }
}