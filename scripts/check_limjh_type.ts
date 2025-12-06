
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

async function check() {
    const { data, error } = await supabase
        .from('users')
        .select('id, name, email, type, role')
        .ilike('email', 'limjh%')
        .single()

    if (error) {
        console.error("Error:", error.message)
        return
    }

    console.log("User Info:")
    console.log(JSON.stringify(data, null, 2))
}

check()
