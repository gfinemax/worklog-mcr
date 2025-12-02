
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkShiftConfig() {
    console.log('Checking shift configuration...')

    // 1. Get Config
    const { data: config, error } = await supabase
        .from('shift_pattern_configs')
        .select('*')
        .order('valid_from', { ascending: false })
        .limit(1)
        .single()

    if (error) {
        console.error('Error fetching config:', error)
        return
    }

    console.log('Pattern JSON:', JSON.stringify(config.pattern_json, null, 2))

    // 2. Calculate for 2025-12-01 (Today)
    const targetDate = new Date('2025-12-01T12:00:00+09:00') // Noon KST
    const anchorDate = new Date(config.valid_from)

    // Reset hours for accurate diff
    targetDate.setHours(0, 0, 0, 0)
    anchorDate.setHours(0, 0, 0, 0)

    const diffTime = targetDate.getTime() - anchorDate.getTime()
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

    console.log(`\nTarget Date: 2025-12-01`)
    console.log(`Anchor Date: ${config.valid_from}`)
    console.log(`Diff Days: ${diffDays}`)

    const cycleLength = config.cycle_length
    const pattern = config.pattern_json

    const index = diffDays % cycleLength
    console.log(`Cycle Index: ${index}`)

    const dailyPattern = pattern.find((p: any) => p.day === index)

    if (dailyPattern) {
        console.log(`Day Shift Team: ${dailyPattern.A.team}`)
        console.log(`Night Shift Team: ${dailyPattern.N.team}`)
    } else {
        console.log('Pattern not found for index')
    }

    // 3. Calculate for 2025-12-02 (Tomorrow)
    const nextDiffDays = diffDays + 1
    const nextIndex = nextDiffDays % cycleLength
    const nextDailyPattern = pattern.find((p: any) => p.day === nextIndex)

    console.log(`\nTarget Date: 2025-12-02`)
    if (nextDailyPattern) {
        console.log(`Day Shift Team: ${nextDailyPattern.A.team}`)
        console.log(`Night Shift Team: ${nextDailyPattern.N.team}`)
    } else {
        console.log('Pattern not found for next index')
    }
}

checkShiftConfig()
