
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

async function updateType() {
    const emails = ['limjh@mbcplus.com', 'limkh@mbcplus.com']

    for (const email of emails) {
        const { error } = await supabase
            .from('users')
            .update({ type: 'support' }) // Explicitly set type to 'support'
            .ilike('email', email)

        if (error) console.error(`Error updating ${email}:`, error.message)
        else console.log(`Updated ${email} to type='support'`)
    }
}

updateType()
