
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugRoster() {
    const targetDate = '2025-12-03'
    console.log(`Fetching config for date: ${targetDate}`)

    const { data: config, error } = await supabase
        .from('shift_pattern_configs')
        .select('*')
        .lte('valid_from', targetDate)
        .or(`valid_to.is.null,valid_to.gte.${targetDate}`)
        .order('valid_from', { ascending: false })
        .limit(1)
        .single()

    if (error) {
        console.error('Error fetching config:', error)
        return
    }

    if (!config) {
        console.log('No config found')
        return
    }

    console.log('Config found:', {
        id: config.id,
        valid_from: config.valid_from,
        created_at: config.created_at
    })

    if (config.roster_json) {
        console.log('Roster JSON keys:', Object.keys(config.roster_json))

        // Check 1조
        const team1Ids = config.roster_json['1조'] || []
        console.log(`1조 IDs:`, team1Ids)
        if (team1Ids.length > 0) {
            const { data: users1 } = await supabase.from('users').select('name').in('id', team1Ids)
            console.log('1조 Members in Roster:', users1?.map(u => u.name))
        }

        // Check 2조
        const team2Ids = config.roster_json['2조'] || []
        console.log(`2조 IDs:`, team2Ids)
        if (team2Ids.length > 0) {
            const { data: users2 } = await supabase.from('users').select('name').in('id', team2Ids)
            console.log('2조 Members in Roster:', users2?.map(u => u.name))
        }
    } else {
        console.log('No roster_json found in config')
    }
}

debugRoster()
