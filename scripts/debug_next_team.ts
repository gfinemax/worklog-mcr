
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { ShiftPatternConfig } from '../lib/shift-rotation'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Re-implement getNextTeam here to avoid importing client-side code
function getNextTeam(currentTeam: string, currentShift: 'day' | 'night', config: ShiftPatternConfig): string | null {
    const currentPatternIndex = config.pattern_json.findIndex(p => {
        if (currentShift === 'day') return p.A.team === currentTeam
        return p.N.team === currentTeam
    })

    if (currentPatternIndex === -1) return null

    let nextTeam = ''

    if (currentShift === 'day') {
        const pattern = config.pattern_json.find(p => p.day === currentPatternIndex)
        if (pattern) {
            nextTeam = pattern.N.team
        }
    } else {
        const nextDayIndex = (currentPatternIndex + 1) % config.cycle_length
        const pattern = config.pattern_json.find(p => p.day === nextDayIndex)
        if (pattern) {
            nextTeam = pattern.A.team
        }
    }

    return nextTeam || null
}

async function debugNextTeam() {
    console.log('Debugging getNextTeam...')

    const { data: config, error } = await supabase
        .from('shift_pattern_configs')
        .select('*')
        .order('valid_from', { ascending: false })
        .limit(1)
        .single()

    if (error || !config) {
        console.error('Config not found!', error)
        return
    }

    console.log('Config found:', config.id)

    const currentTeam = '4조'
    const currentShift = 'night'

    console.log(`Current Team: ${currentTeam}`)
    console.log(`Current Shift: ${currentShift}`)

    const nextTeam = getNextTeam(currentTeam, currentShift, config)
    console.log(`Calculated Next Team: ${nextTeam}`)

    const nextTeamDay = getNextTeam(currentTeam, 'day', config)
    console.log(`Calculated Next Team (if Day): ${nextTeamDay}`)
}

debugNextTeam()
