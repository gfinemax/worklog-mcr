
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkPatternJson() {
    console.log('Checking shift_pattern_configs for malformed pattern_json...')

    const { data: configs, error } = await supabase
        .from('shift_pattern_configs')
        .select('id, pattern_json')

    if (error) {
        console.error('Error fetching configs:', error)
        return
    }

    if (!configs || configs.length === 0) {
        console.log('No configs found.')
        return
    }

    let hasError = false
    configs.forEach((config: any) => {
        if (!config.pattern_json || !Array.isArray(config.pattern_json)) {
            console.error(`Config ${config.id}: pattern_json is missing or not an array`)
            hasError = true
            return
        }

        config.pattern_json.forEach((day: any, index: number) => {
            if (!day.A) {
                console.error(`Config ${config.id}, Day ${index}: Missing 'A' object`)
                hasError = true
            } else if (!day.A.team) {
                console.error(`Config ${config.id}, Day ${index}: Missing 'A.team'`)
                hasError = true
            }

            if (!day.N) {
                console.error(`Config ${config.id}, Day ${index}: Missing 'N' object`)
                hasError = true
            } else if (!day.N.team) {
                console.error(`Config ${config.id}, Day ${index}: Missing 'N.team'`)
                hasError = true
            }
        })
    })

    if (!hasError) {
        console.log('All configs have valid pattern_json structure.')
    } else {
        console.log('Found errors in pattern_json structure.')
    }
}

checkPatternJson()
