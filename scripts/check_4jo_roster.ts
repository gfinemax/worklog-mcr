import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
    'https://ohfxmrkpoxhspjfomlkv.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
    const targetDate = new Date('2025-11-15')

    // Get the active config for this date
    const { data: configs } = await supabase
        .from('shift_pattern_configs')
        .select('id, name, roster_json, created_at')
        .lte('starts_at', targetDate.toISOString())
        .order('starts_at', { ascending: false })
        .limit(1)

    if (configs && configs.length > 0) {
        const config = configs[0]
        console.log('Config name:', config.name)
        console.log('Roster JSON teams:', Object.keys(config.roster_json || {}))

        // Check 4조 roster
        if (config.roster_json?.['4조']) {
            console.log('\n4조 roster user IDs:', config.roster_json['4조'])

            // Fetch user details
            const userIds = config.roster_json['4조']
            const { data: users } = await supabase
                .from('users')
                .select('id, name, role')
                .in('id', userIds)

            console.log('\n4조 members:')
            users?.forEach(u => console.log(`  - ${u.name} (${u.role})`))
        } else {
            console.log('\n4조 roster is EMPTY or MISSING!')
        }
    } else {
        console.log('No config found')
    }
}

main().catch(console.error)
