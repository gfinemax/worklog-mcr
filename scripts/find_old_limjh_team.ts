
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

async function checkOld() {
    // Try to find any user with name '임제혁' that is NOT the new ID
    const { data } = await supabase
        .from('users')
        .select('*, group_members(*, groups(*))')
        .eq('name', '임제혁')
        .neq('id', '625339d2-18b4-4cc1-9d79-52f775b34b71')

    console.log("Old profiles:", JSON.stringify(data, null, 2))
}
checkOld()
