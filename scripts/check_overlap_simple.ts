
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function checkOverlap() {
    const { data: allSupport } = await supabase.from('support_staff').select('name')
    if (!allSupport || allSupport.length === 0) {
        console.log('support_staff is empty.')
        return
    }

    let missing = 0
    for (const staff of allSupport) {
        const { data } = await supabase.from('users').select('id').eq('name', staff.name).maybeSingle()
        if (!data) {
            console.log(`Missing: ${staff.name}`)
            missing++
        }
    }

    console.log(`Total Support: ${allSupport.length}, Missing in Users: ${missing}`)
}

checkOverlap()
