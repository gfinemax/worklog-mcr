
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function inspectConfig() {
    const { data, error } = await supabase
        .from('shift_pattern_configs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    if (error) {
        console.error('Error:', error)
        return
    }

    console.log('Current Config ID:', data.id)
    console.log('Valid From:', data.valid_from)
    console.log('Roster JSON KEYS:', Object.keys(data.roster_json || {}))
    console.log('Roster JSON:', JSON.stringify(data.roster_json, null, 2))


    // Find today's pattern index
    // Assuming cycle starts from valid_from
    const today = new Date()
    const validFrom = new Date(data.valid_from)
    const diffTime = Math.abs(today.getTime() - validFrom.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    // accurate enough for quick check, or use shift-rotation logic

    console.log('Pattern JSON sample (Day 0-2):', data.pattern_json.slice(0, 3))
}

inspectConfig()
