
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDay6() {
    console.log('Checking Day 6 Pattern...')

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
    const day6 = pattern.find((p: any) => p.day === 6)
    const day0 = pattern.find((p: any) => p.day === 0)
    const day5 = pattern.find((p: any) => p.day === 5)

    console.log('Day 0:', JSON.stringify(day0, null, 2))
    console.log('Day 5:', JSON.stringify(day5, null, 2))
    console.log('Day 6:', JSON.stringify(day6, null, 2))
}

checkDay6()
