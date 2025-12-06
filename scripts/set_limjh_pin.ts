
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

async function setPin() {
    const { data: user } = await supabase
        .from('users')
        .select('id')
        .ilike('email', 'limjh%')
        .single()

    if (!user) {
        console.log("User not found")
        return
    }

    const { error } = await supabase
        .from('users')
        .update({ pin_code: '0000' })
        .eq('id', user.id)

    if (error) console.error("Error setting pin:", error.message)
    else console.log("PIN set to 0000 for limjh")
}

setPin()
