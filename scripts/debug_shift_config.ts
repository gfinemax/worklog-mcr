
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

async function checkShiftConfig() {
    console.log('Fetching ALL shift configurations...')

    const { data, error } = await supabase
        .from('shift_pattern_configs')
        .select('id, valid_from, created_at, cycle_length')
        .order('valid_from', { ascending: false })
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching config:', error)
        return
    }

    console.log(`Found ${data.length} configs:`)
    data.forEach((c: any) => {
        console.log(`- ID: ${c.id}, ValidFrom: ${c.valid_from}, CreatedAt: ${c.created_at}`)
    })
}

checkShiftConfig()
