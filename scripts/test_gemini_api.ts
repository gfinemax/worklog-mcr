
import { GoogleGenerativeAI } from '@google/generative-ai'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const apiKey = process.env.GOOGLE_API_KEY

if (!apiKey) {
    console.error('Error: GOOGLE_API_KEY is not set in .env.local')
    process.exit(1)
}

console.log('API Key found:', apiKey.substring(0, 4) + '...')

async function testGemini() {
    console.log('Testing Gemini API...')
    const genAI = new GoogleGenerativeAI(apiKey!)

    // Try the model used in the route
    const modelName = 'gemini-2.0-flash'
    console.log(`Using model: ${modelName}`)

    try {
        const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { responseMimeType: "application/json" }
        })

        const prompt = `
        Generate a JSON object with a "summary" and "title" for the following text:
        "This is a test message to verify the Gemini API connectivity."
        `

        console.log('Sending prompt...')
        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        console.log('Response received:')
        console.log(text)

        try {
            const json = JSON.parse(text)
            console.log('Parsed JSON:', json)
        } catch (e) {
            console.error('Failed to parse JSON:', e)
        }

    } catch (error: any) {
        console.error('Gemini API Error:')
        console.error(error.message || error)

        // Fallback test with a known stable model if the above fails
        if (error.message?.includes('404') || error.message?.includes('not found')) {
            console.log('\nRetrying with gemini-1.5-flash...')
            try {
                const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
                const result = await fallbackModel.generateContent('Hello')
                console.log('Fallback model response:', result.response.text())
            } catch (fallbackError) {
                console.error('Fallback model also failed:', fallbackError)
            }
        }
    }
}

testGemini()
