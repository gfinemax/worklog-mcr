
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

async function inspectUser() {
    // We know the email is limjh@mbcplus.com from registration
    const { data: users, error } = await supabase
        .from('users')
        .select('*, group_members(*, groups(*))')
        .eq('email', 'limjh@mbcplus.com')

    if (error) console.error(error)
    else console.log(JSON.stringify(users, null, 2))
}

inspectUser()
