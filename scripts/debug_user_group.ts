
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUser() {
    const name = '박상필'
    console.log(`Checking user: ${name}`)

    const { data: user, error } = await supabase
        .from('users')
        .select('id, name, is_active')
        .eq('name', name)
        .single()

    if (error) {
        console.error('Error fetching user:', error)
        return
    }

    console.log('User found:', user)

    const { data: groupMember, error: groupError } = await supabase
        .from('group_members')
        .select('group_id, role, groups(name)')
        .eq('user_id', user.id)
        .single()

    if (groupError) {
        console.error('Error fetching group:', groupError)
    } else {
        console.log('Group info:', groupMember)
    }

    // Also check current shift config
    const today = new Date().toISOString().split('T')[0]
    console.log(`Checking shift config for today: ${today}`)

    const { data: config, error: configError } = await supabase
        .from('shift_pattern_configs')
        .select('*')
        .lte('valid_from', today)
        .order('valid_from', { ascending: false })
        .limit(1)
        .single()

    if (configError) {
        console.error('Error fetching config:', configError)
    } else {
        console.log('Config found:', config.id)
        console.log('Cycle Length:', config.cycle_length)
        console.log('Valid From:', config.valid_from)

        // Calculate today's pattern
        const anchorDate = new Date(config.valid_from)
        const targetDate = new Date(today)
        const diffTime = Math.abs(targetDate.getTime() - anchorDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        // Note: Math.ceil might be risky with timezones, but let's see.
        // Better to use simple subtraction if UTC.

        console.log('Diff Days:', diffDays)
        const index = diffDays % config.cycle_length
        console.log('Day Index:', index)
        const pattern = config.pattern_json.find((p: any) => p.day === index)
        console.log('Pattern for today:', pattern)
    }
}

checkUser()
