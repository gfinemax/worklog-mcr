
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkShift() {
    // Target: Dec 1st, 2025
    const targetDateStr = '2025-12-01'

    // Fetch config
    const { data: config, error } = await supabase
        .from('shift_pattern_configs')
        .select('*')
        .lte('valid_from', targetDateStr)
        .or(`valid_to.is.null,valid_to.gte.${targetDateStr}`)
        .order('valid_from', { ascending: false })
        .limit(1)
        .single()

    if (error || !config) {
        console.error('Error fetching config:', error)
        return
    }

    const anchorDateStr = config.valid_from
    const targetDate = new Date(targetDateStr)
    const anchorDate = new Date(anchorDateStr)

    // Reset hours
    targetDate.setHours(0, 0, 0, 0)
    anchorDate.setHours(0, 0, 0, 0)

    const diffTime = targetDate.getTime() - anchorDate.getTime()
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

    let index = diffDays % config.cycle_length
    if (index < 0) index += config.cycle_length

    let output = ''
    output += `Target Date: ${targetDateStr}\n`
    output += `Anchor Date: ${anchorDateStr}\n`
    output += `Diff Days: ${diffDays}\n`
    output += `Index in cycle: ${index}\n`

    const pattern = config.pattern_json.find((p: any) => p.day === index)

    if (pattern) {
        output += `Day Shift (A): Team ${pattern.A.team}\n`
        output += `Night Shift (N): Team ${pattern.N.team}\n`

        // 20:00 is Night Shift
        output += `Current Shift (20:00): Team ${pattern.N.team} (Night)\n`
    } else {
        output += 'Pattern not found for index\n'
    }

    fs.writeFileSync(path.resolve(__dirname, 'shift_output.txt'), output)
    console.log('Output written to scripts/shift_output.txt')
}

checkShift()
