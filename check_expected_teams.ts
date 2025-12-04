
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { differenceInDays, parseISO, format } from 'date-fns'

// Load env
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8')
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=')
        if (key && value) {
            process.env[key.trim()] = value.trim()
        }
    })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl!, supabaseKey!)

async function checkExpectedTeams() {
    // Fetch active config
    const today = format(new Date(), 'yyyy-MM-dd')
    const { data: config, error } = await supabase
        .from('shift_pattern_configs')
        .select('*')
        .lte('valid_from', today)
        .or(`valid_to.is.null,valid_to.gte.${today}`)
        .order('valid_from', { ascending: false })
        .limit(1)
        .single()

    if (error || !config) {
        console.error('Error fetching config:', error)
        return
    }

    const datesToCheck = [
        '2025-12-04',
        '2025-12-02',
        '2025-12-01',
        '2025-11-30',
        '2025-11-29'
    ]

    console.log('--- Expected Teams ---')
    for (const date of datesToCheck) {
        const teams = getTeamsForDate(date, config)
        console.log(`${date}: Day=${teams?.A}, Night=${teams?.N}`)
    }
}

function getTeamsForDate(date: string, config: any) {
    const targetDate = parseISO(date)
    const anchorDate = parseISO(config.valid_from)

    const diff = differenceInDays(targetDate, anchorDate)
    let index = diff % config.cycle_length
    if (index < 0) index += config.cycle_length

    const dailyPattern = config.pattern_json.find((p: any) => p.day === index)

    if (!dailyPattern) return null

    return {
        A: dailyPattern.A.team,
        N: dailyPattern.N.team
    }
}

checkExpectedTeams()
