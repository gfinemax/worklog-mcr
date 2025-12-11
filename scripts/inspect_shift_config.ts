
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { join } from 'path'

// Load environment variables from .env.local
dotenv.config({ path: join(process.cwd(), '.env.local') })

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkConfig() {
    console.log('Checking active shift configuration...')
    const today = new Date().toISOString().split('T')[0]

    const { data: configs, error } = await supabase
        .from('shift_pattern_configs')
        .select('*')
        .lte('valid_from', today)
        .or(`valid_to.is.null,valid_to.gte.${today}`)
        .order('valid_from', { ascending: false })

    if (error) {
        console.error('Error fetching config:', error)
        return
    }

    if (!configs || configs.length === 0) {
        console.log('No active configuration found for today:', today)
        return
    }

    const config = configs[0]
    console.log('Active Configuration ID:', config.id)
    console.log('Valid From:', config.valid_from)
    console.log('Cycle Length:', config.cycle_length)
    console.log('Pattern JSON Preview:', JSON.stringify(config.pattern_json))

    // Calculate current cycle index
    const anchorDate = new Date(config.valid_from)
    // Adjust anchor date for local timezone if needed, but usually valid_from is YYYY-MM-DD string
    // Let's treat it as UTC notation for calculation to match shift-rotation.ts logic
    // actually shift-rotation uses parseISO provided by date-fns

    // We'll mimic the logic:
    const targetDate = new Date()
    const diffTime = targetDate.getTime() - anchorDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    let index = diffDays % config.cycle_length
    if (index < 0) index += config.cycle_length

    console.log(`\nCalculation for Today (${today}):`)
    console.log('Days since valid_from:', diffDays)
    console.log('Cycle Index:', index)

    const todaysPattern = config.pattern_json.find((p: any) => p.day === index)
    console.log('Pattern for today (index ' + index + '):', todaysPattern)
}

checkConfig()
