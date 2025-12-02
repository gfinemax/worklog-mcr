
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function findPattern() {
    console.log('Searching for 4조 N -> 5조 A pattern...')

    const { data: config, error } = await supabase
        .from('shift_pattern_configs')
        .select('*')
        .order('valid_from', { ascending: false })
        .limit(1)
        .single()

    if (error) {
        console.error('Error:', error)
        return
    }

    const pattern = config.pattern_json
    const cycleLength = config.cycle_length

    console.log(`Cycle Length: ${cycleLength}`)

    pattern.forEach((p: any) => {
        if (p.N.team === '4조') {
            console.log(`\nFound 4조 N at Day Index: ${p.day}`)

            // Check Next Day (Day Shift)
            const nextIndex = (p.day + 1) % cycleLength
            const nextDayPattern = pattern.find((np: any) => np.day === nextIndex)

            if (nextDayPattern) {
                console.log(`  -> Next Day (${nextIndex}) Day Shift: ${nextDayPattern.A.team}`)
                if (nextDayPattern.A.team === '5조') {
                    console.log('  *** MATCH FOUND! ***')
                }
            }
        }
    })
}

findPattern()
