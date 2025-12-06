
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

async function checkUser() {
    const { data } = await supabase
        .from('users')
        .select('*, group_members(*, groups(*))')
        .eq('name', '임근형')

    console.log("Lim Geun Hyung Profile:", JSON.stringify(data, null, 2))
}
checkUser()
