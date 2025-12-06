
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { differenceInDays, parseISO } from 'date-fns'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixDuplicates() {
    console.log('Starting duplicate fix for 2025-12-06...')
    const targetDateStr = '2025-12-06'
    const targetDate = parseISO(targetDateStr)

    // 1. Get Config
    const { data: config, error: configError } = await supabase
        .from('shift_pattern_configs')
        .select('*')
        .lte('valid_from', targetDateStr)
        .or(`valid_to.is.null,valid_to.gte.${targetDateStr}`)
        .order('valid_from', { ascending: false })
        .limit(1)
        .single()

    if (configError || !config) {
        console.error('Error fetching config:', configError)
        return
    }

    // 2. Calculate Correct Team
    const anchorDate = parseISO(config.valid_from)
    const diff = differenceInDays(targetDate, anchorDate)
    let index = diff % config.cycle_length
    if (index < 0) index += config.cycle_length

    const dailyPattern = config.pattern_json.find((p: any) => p.day === index)

    if (!dailyPattern) {
        console.error('Pattern not found for index:', index)
        return
    }

    const correctTeam = dailyPattern.A.team
    console.log(`Correct Team for ${targetDateStr} (Day Shift) is: ${correctTeam}`)

    // 3. Fetch Worklogs
    const { data: worklogs, error: worklogsError } = await supabase
        .from('worklogs')
        .select('id, group_name, status')
        .eq('date', targetDateStr)
        .eq('type', '주간')

    if (worklogsError || !worklogs) {
        console.error('Error fetching worklogs:', worklogsError)
        return
    }

    console.log('Found worklogs:', worklogs)

    // 4. Identify and Delete Incorrect Worklog
    const incorrectWorklogs = worklogs.filter(w => w.group_name !== correctTeam)

    if (incorrectWorklogs.length === 0) {
        console.log('No incorrect worklogs found.')
        return
    }

    for (const log of incorrectWorklogs) {
        console.log(`Deleting incorrect worklog: ID=${log.id}, Team=${log.group_name}`)

        const { error: deleteError } = await supabase
            .from('worklogs')
            .delete()
            .eq('id', log.id)

        if (deleteError) {
            console.error('Error deleting worklog:', deleteError)
        } else {
            console.log('Successfully deleted worklog.')
        }
    }
}

fixDuplicates()
