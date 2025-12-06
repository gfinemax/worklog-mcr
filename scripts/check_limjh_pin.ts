
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

async function checkPin() {
    const { data, error } = await supabase
        .from('users')
        .select('name, email, pin_code')
        .ilike('email', 'limjh%')
        .single()

    if (error) {
        console.error("Error:", error.message)
        return
    }

    console.log(`User: ${data.name}, PIN: ${data.pin_code}`)
}

checkPin()
