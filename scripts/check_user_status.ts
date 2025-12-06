
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

async function check() {
    const { data } = await supabase.from('users').select('*').or('name.eq.임제혁,email.eq.limjh,email.eq.limjh@mbcplus.com')
    console.log("Found profiles:", data)
}
check()
