
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

console.log('Loading dotenv...')
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })
console.log('Dotenv loaded.')

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('Env vars not loaded!')
    process.exit(1)
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('Supabase URL:', supabaseUrl)

async function testFundamentalFix() {
    console.log('Importing shiftService...')
    const { shiftService } = await import('../lib/shift-rotation')
    console.log('shiftService imported.')

    const supabase = createClient(supabaseUrl!, supabaseKey!)

    console.log('Testing Fundamental Fix Logic...')

    // 1. Fetch Config
    const { data: config } = await supabase
        .from('shift_pattern_configs')
        .select('*')
        .order('valid_from', { ascending: false })
        .limit(1)
        .single()

    if (!config) {
        console.error('Config not found')
        return
    }

    // 2. Test Cases
    const testCases = [
        { time: '2025-12-04T10:00:00+09:00', expectedShift: 'day', expectedDate: '2025-12-04' }, // Day Shift
        { time: '2025-12-04T20:00:00+09:00', expectedShift: 'night', expectedDate: '2025-12-04' }, // Night Shift (Evening)
        { time: '2025-12-05T03:00:00+09:00', expectedShift: 'night', expectedDate: '2025-12-04' }, // Night Shift (Early Morning next day)
    ]

    for (const test of testCases) {
        const dateObj = new Date(test.time)
        console.log(`Testing time: ${test.time}`)

        const result = shiftService.getExpectedWorklogInfo(dateObj, config)

        if (!result) {
            console.error('Result is null!')
            continue
        }

        console.log(`  Result: Date=${result.date}, Shift=${result.shift}, Team=${result.team}`)

        if (result.date === test.expectedDate && result.shift === test.expectedShift) {
            console.log('  PASS')
        } else {
            console.error(`  FAIL. Expected Date=${test.expectedDate}, Shift=${test.expectedShift}`)
        }
    }
}

testFundamentalFix().catch(err => console.error('Main error:', err))
