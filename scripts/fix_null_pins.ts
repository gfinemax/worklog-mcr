
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

async function main() {
    console.log('--- Inspecting Lim Je Hyuk (limjh) ---')
    // Check limjh specifically
    const { data: limjh, error: limError } = await supabase
        .from('users')
        .select('id, name, email, pin_code, type, organization')
        .ilike('name', '%임제혁%') // or 'limjh' depending on name

    if (limError) console.error('Error finding limjh:', limError)
    else {
        console.log('Lim Je Hyuk Record(s):', limjh)
    }

    console.log('\n--- Checking NULL PINs ---')
    const { count, error: countError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .is('pin_code', null)

    if (countError) console.error("Error counting null pins:", countError)
    else console.log(`Found ${count} users with NULL pin_code`)

    console.log('\n--- Updating NULL PINs to 0000 ---')
    const { data: updated, error: updateError } = await supabase
        .from('users')
        .update({ pin_code: '0000' })
        .is('pin_code', null)
        .select()

    if (updateError) {
        console.error('Update failed:', updateError)
    } else {
        console.log(`Successfully updated ${updated.length} users to PIN 0000`)
    }
}

main()
