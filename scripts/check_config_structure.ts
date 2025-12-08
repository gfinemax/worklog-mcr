import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
    'https://ohfxmrkpoxhspjfomlkv.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
    // Get the config for Nov 15
    const { data: configs, error } = await supabase
        .from('shift_pattern_configs')
        .select('*')
        .lte('valid_from', '2025-11-15')
        .order('valid_from', { ascending: false })
        .limit(1)

    if (error) {
        console.error('Error:', error)
        return
    }

    if (configs && configs.length > 0) {
        const config = configs[0]
        console.log('=== Config Structure ===')
        console.log('ID:', config.id)
        console.log('Name:', config.name)
        console.log('valid_from:', config.valid_from)

        console.log('\n=== Pattern JSON (Day 0 / 1일차) ===')
        const day0 = config.pattern_json?.find((p: any) => p.day === 0)
        console.log(JSON.stringify(day0, null, 2))

        console.log('\n=== Roster JSON ===')
        console.log('Keys:', Object.keys(config.roster_json || {}))
        if (config.roster_json?.['4조']) {
            console.log('4조 user IDs:', config.roster_json['4조'])
        } else {
            console.log('4조 roster: NOT FOUND')
        }

        // Check if there's roster info inside pattern_json
        console.log('\n=== Full Day 0 Pattern ===')
        if (day0) {
            console.log('A:', JSON.stringify(day0.A, null, 2))
            console.log('N:', JSON.stringify(day0.N, null, 2))
        }
    } else {
        console.log('No config found')
    }
}

main().catch(console.error)
