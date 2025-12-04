
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { differenceInDays, parseISO, format, addDays } from 'date-fns'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Inline shift service logic
const shiftService = {
    calculateShift(date: Date | string, teamName: string, config: any) {
        const targetDate = typeof date === 'string' ? parseISO(date) : date
        const anchorDate = parseISO(config.valid_from)

        const diff = differenceInDays(targetDate, anchorDate)
        let index = diff % config.cycle_length
        if (index < 0) index += config.cycle_length

        const dailyPattern = config.pattern_json.find((p: any) => p.day === index)

        if (!dailyPattern) {
            return { shiftType: 'Y' }
        }

        let shiftType = 'Y'

        if (dailyPattern.A.team === teamName) {
            shiftType = 'A'
        } else if (dailyPattern.N.team === teamName) {
            shiftType = 'N'
        }

        return { shiftType, dayIndex: index }
    }
}

async function verifyShift() {
    console.log('Verifying shift for 2025-12-03...')

    const targetDate = '2025-12-03'

    const { data: config, error } = await supabase
        .from('shift_pattern_configs')
        .select('*')
        .lte('valid_from', targetDate)
        .or(`valid_to.is.null,valid_to.gte.${targetDate}`)
        .order('valid_from', { ascending: false })
        .limit(1)
        .single()

    if (!config) {
        console.log('No config found')
        return
    }

    console.log('Config found:', config.id)

    // Check for 1조 (Team 1)
    const info1 = shiftService.calculateShift(targetDate, '1조', config)
    console.log('1조 Shift:', info1.shiftType, '(Day Index:', info1.dayIndex, ')')

    // Check for 2조 (Team 2)
    const info2 = shiftService.calculateShift(targetDate, '2조', config)
    console.log('2조 Shift:', info2.shiftType, '(Day Index:', info2.dayIndex, ')')

    // Check for 3조
    const info3 = shiftService.calculateShift(targetDate, '3조', config)
    console.log('3조 Shift:', info3.shiftType, '(Day Index:', info3.dayIndex, ')')

    // Check for 4조
    const info4 = shiftService.calculateShift(targetDate, '4조', config)
    console.log('4조 Shift:', info4.shiftType, '(Day Index:', info4.dayIndex, ')')
}

verifyShift()
