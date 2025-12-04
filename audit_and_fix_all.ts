
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

const roster: Record<string, { director: string[], assistant: string[], video: string[] }> = {
    '1조': { director: ['김준일'], assistant: ['박상필'], video: ['김소연'] },
    '2조': { director: ['황동성'], assistant: ['이석훈'], video: ['강한강'] },
    '3조': { director: ['남궁장'], assistant: ['이종원'], video: ['윤주현'] },
    '4조': { director: ['권영춘'], assistant: ['김희성'], video: ['심창규'] },
    '5조': { director: ['정광훈'], assistant: ['오동섭'], video: ['김단언'] }
}

async function auditAndFix() {
    console.log('Starting audit...')

    // 1. Get Config
    const today = format(new Date(), 'yyyy-MM-dd')
    const { data: config, error: configError } = await supabase
        .from('shift_pattern_configs')
        .select('*')
        .lte('valid_from', today)
        .or(`valid_to.is.null,valid_to.gte.${today}`)
        .order('valid_from', { ascending: false })
        .limit(1)
        .single()

    if (configError || !config) {
        console.error('Error fetching config:', configError)
        return
    }

    // 2. Get Groups for ID mapping
    const { data: groups } = await supabase.from('groups').select('id, name')
    const getGroupId = (name: string) => groups?.find(g => g.name === name)?.id

    // 3. Get All Worklogs
    const { data: worklogs, error: logsError } = await supabase
        .from('worklogs')
        .select('*')
        .order('date', { ascending: false })

    if (logsError) {
        console.error('Error fetching worklogs:', logsError)
        return
    }

    console.log(`Auditing ${worklogs.length} worklogs...`)

    for (const log of worklogs) {
        const expected = getExpectedTeam(log.date, log.type, config)

        if (!expected) {
            console.warn(`Could not calculate expected team for ${log.date}`)
            continue
        }

        if (log.group_name !== expected) {
            console.log(`MISMATCH [${log.date} ${log.type}]: Found '${log.group_name}', Expected '${expected}'`)

            const groupId = getGroupId(expected)
            const workers = roster[expected]

            if (groupId && workers) {
                console.log(`  -> Fixing to '${expected}'...`)
                const { error: updateError } = await supabase
                    .from('worklogs')
                    .update({
                        group_name: expected,
                        group_id: groupId,
                        workers: workers
                    })
                    .eq('id', log.id)

                if (updateError) console.error('  -> Update failed:', updateError)
                else console.log('  -> Fixed.')
            } else {
                console.error(`  -> Cannot fix: Missing Group ID or Roster for '${expected}'`)
            }
        } else {
            // console.log(`OK [${log.date} ${log.type}]: ${log.group_name}`)
        }
    }
    console.log('Audit complete.')
}

function getExpectedTeam(date: string, type: string, config: any) {
    const targetDate = parseISO(date)
    const anchorDate = parseISO(config.valid_from)

    const diff = differenceInDays(targetDate, anchorDate)
    let index = diff % config.cycle_length
    if (index < 0) index += config.cycle_length

    const dailyPattern = config.pattern_json.find((p: any) => p.day === index)

    if (!dailyPattern) return null

    if (type === '주간') return dailyPattern.A.team
    if (type === '야간') return dailyPattern.N.team
    return null
}

auditAndFix()
