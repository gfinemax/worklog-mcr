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
        const prompt = `당신은 mbc플러스 주조정실 20년차 기술감독로서 방송 콘텐츠와 기술에 많은 지식이 있어서 관련 내용을 한 문장으로 잘 정리하는 능력이 있어.

[작업]
아래 본문을 읽고, 다음 두 가지를 생성하세요:
1. **summary**: 업무일지용 요약 (공백 포함 50자 이내)
2. **title**: 포스트 제목용 요약 (공백 포함 40자 이내)

[제목] ${title || '없음'}
[카테고리] ${category || '일반'}

[본문]
${plainText.substring(0, 1500)}

[요약 규칙]
- **title**: 
    1. 본문에서 가장 중요한 **핵심 키워드(예: 역사, 분석, 전략, 이슈 등)**를 반드시 포함할 것.
    2. "~에 대한 내용" 같은 설명조를 피하고, **뉴스 헤드라인처럼 명확하고 구체적으로** 작성할 것.
    3. 모호한 표현 대신 **구체적인 대상과 결론**을 명시할 것.
- **summary**: 본문 전체 내용을 포괄하는 핵심 요약. "~함", "~임" 등의 개조식 종결어미 사용 권장.
- **summary는 50자 이내, title은 40자 이내로 제한**
- **반드시 JSON 형식으로 출력할 것**
- 예시:
{
  "summary": "일본 예능의 한국 영향력 분석 및 시사점 도출",
  "title": "일본 예능의 역사와 한국 시장에 미친 영향 분석"
}

[출력 결과 (JSON)]`

        console.log('Calling Gemini API...')

        const genAI = new GoogleGenerativeAI(apiKey)
        // Use stable model 1.5-flash
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', generationConfig: { responseMimeType: "application/json" } })

        let resultData = { summary: '', title: '' }

        try {
            const result = await model.generateContent(prompt)
            const response = await result.response
            let text = response.text().trim()

            // Remove markdown code blocks if present
            if (text.startsWith('```')) {
                text = text.replace(/^```(json)?\n/, '').replace(/\n```$/, '')
            }

            resultData = JSON.parse(text)
        } catch (error: any) {
            console.error("Gemini API Error:", error)
            if (error.message?.includes('429') || error.status === 429) {
                return NextResponse.json(
                    { error: '일일 AI 사용량이 초과되었습니다. 내일 다시 시도해주세요.' },
                    { status: 429 }
                )
            }
            throw error
        }

        console.log('Generated summary:', resultData)
        return NextResponse.json(resultData)

    } catch (error: any) {
        console.error('=== Post Summary Error ===')
        console.error('Error:', error)

        return NextResponse.json(
            {
                error: 'AI 요약 생성 실패',
                details: error.message || String(error)
            },
            { status: 500 }
        )
    }
}