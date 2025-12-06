
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyShift() {
    const targetDate = '2025-12-06'
    console.log(`Fetching active shift config for ${targetDate}...`)

    const { data: config, error } = await supabase
        .from('shift_pattern_configs')
        .select('*')
        .lte('valid_from', targetDate)
        .or(`valid_to.is.null,valid_to.gte.${targetDate}`)
        .order('valid_from', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (error || !config) {
        console.error('Error fetching config:', JSON.stringify(error, null, 2))
        return
    }

    console.log('Valid From:', config.valid_from)
    console.log('Cycle Length:', config.cycle_length)

    const startDate = new Date(config.valid_from)
    const targetDateObj = new Date(targetDate)

    // Calculate days diff
    const diffTime = targetDateObj.getTime() - startDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    console.log('Days since start:', diffDays)

    const cycleLength = config.cycle_length
    let index = diffDays % cycleLength
    if (index < 0) index += cycleLength

    console.log('Cycle Index:', index)

    const patternJson = config.pattern_json
    const dailyPattern = patternJson.find((p: any) => p.day === index)

    if (dailyPattern) {
        console.log('Daily Pattern Found:', JSON.stringify(dailyPattern, null, 2))
        console.log(`Day Shift Team: ${dailyPattern.A.team}`)
        console.log(`Night Shift Team: ${dailyPattern.N.team}`)
    } else {
        console.error('Daily pattern not found for index:', index)
    }
}

verifyShift()
