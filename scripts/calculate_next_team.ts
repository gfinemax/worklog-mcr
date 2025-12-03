
import { createClient } from '@supabase/supabase-js'
import { differenceInDays, parseISO, addDays, format } from 'date-fns'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
    const now = new Date('2025-12-01T18:00:14+09:00') // Fixed time as per user request context
    const dateStr = format(now, 'yyyy-MM-dd')

    console.log(`Current Time: ${now.toISOString()}`)

    // 1. Fetch Config
    const { data: config, error } = await supabase
        .from('shift_pattern_configs')
        .select('*')
        .lte('valid_from', dateStr)
        .or(`valid_to.is.null,valid_to.gte.${dateStr}`)
        .order('valid_from', { ascending: false })
        .limit(1)
        .single()

    if (error || !config) {
        console.error('Failed to fetch config:', error)
        return
    }

    console.log(`Config Found: Valid From ${config.valid_from}, Cycle ${config.cycle_length}`)

    // 2. Calculate Day Index
    const anchorDate = parseISO(config.valid_from)
    const diff = differenceInDays(now, anchorDate)
    let index = diff % config.cycle_length
    if (index < 0) index += config.cycle_length

    console.log(`Day Index: ${index}`)

    // 3. Determine Current Shift (Day vs Night)
    // Day: 07:30 ~ 18:30
    // Night: 18:30 ~ 07:30
    const hours = now.getHours()
    const minutes = now.getMinutes()
    const timeInMinutes = hours * 60 + minutes

    const dayStart = 7 * 60 + 30
    const dayEnd = 18 * 60 + 30

    const isDayShift = timeInMinutes >= dayStart && timeInMinutes < dayEnd
    const currentShift = isDayShift ? 'A' : 'N'

    console.log(`Current Shift Type: ${currentShift} (isDay: ${isDayShift})`)

    // 4. Get Current Team
    const pattern = config.pattern_json.find((p: any) => p.day === index)
    if (!pattern) {
        console.error('Pattern not found for index', index)
        return
    }

    const currentTeam = currentShift === 'A' ? pattern.A.team : pattern.N.team
    console.log(`Current Team: ${currentTeam}`)

    // 5. Calculate Next Team
    let nextTeam = ''
    let nextShift = ''
    let nextDate = ''

    if (currentShift === 'A') {
        // Next is Night of SAME day
        nextTeam = pattern.N.team
        nextShift = 'N'
        nextDate = dateStr
    } else {
        // Next is Day of NEXT day
        const nextDayIndex = (index + 1) % config.cycle_length
        const nextPattern = config.pattern_json.find((p: any) => p.day === nextDayIndex)
        nextTeam = nextPattern.A.team
        nextShift = 'A'
        nextDate = format(addDays(now, 1), 'yyyy-MM-dd')
    }

    console.log(`\n--- RESULT ---`)
    console.log(`Next Team: ${nextTeam}`)
    console.log(`Next Shift: ${nextShift}`)
    console.log(`Next Date: ${nextDate}`)
}

main()
