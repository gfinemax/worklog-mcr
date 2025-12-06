
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

async function checkConfig() {
    const { data } = await supabase
        .from('shift_pattern_configs')
        .select('*')
        .eq('is_active', true)

    console.log("Active Configs:", JSON.stringify(data?.map(c => c.roster_json), null, 2))

    // Check if any roster includes '지원팀' or if '지원팀' is handled separately
}
checkConfig()
