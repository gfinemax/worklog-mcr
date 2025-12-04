
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key')
    process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey)

async function debugCronLogic() {
    console.log('Debugging Cron Logic for 2025-12-04...')

    const targetDateStr = '2025-12-04'

    // Fetch Config
    const { data: configData, error: configError } = await supabaseAdmin
        .from('shift_pattern_configs')
        .select('*')
        .lte('valid_from', targetDateStr)
        .or(`valid_to.is.null,valid_to.gte.${targetDateStr}`)
        .order('valid_from', { ascending: false })
        .limit(1)
        .single()

    if (configError || !configData) {
        console.error('Config not found:', configError)
        return
    }

    console.log('Config found:', configData.id)
    console.log('Valid From:', configData.valid_from)

    // Logic from route.ts
    const pattern = configData.pattern_json
    const baseDate = new Date(configData.valid_from)
    const targetDateObj = new Date(targetDateStr)

    // Reset hours
    targetDateObj.setHours(0, 0, 0, 0)
    baseDate.setHours(0, 0, 0, 0)

    const diffTime = targetDateObj.getTime() - baseDate.getTime()
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

    console.log('Diff Days:', diffDays)
    console.log('Cycle Length:', configData.cycle_length)

    let index = diffDays % configData.cycle_length
    if (index < 0) index += configData.cycle_length

    console.log('Index:', index)

    const dailyPattern = pattern.find((p: any) => p.day === index)

    if (!dailyPattern) {
        console.log('Pattern not found for index')
        return
    }

    console.log('Day Team:', dailyPattern.A.team)
    console.log('Night Team:', dailyPattern.N.team)
}

debugCronLogic()
