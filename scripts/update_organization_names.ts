
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

async function updateOrganizations() {
    console.log("Starting update...")

    // 1. Update NULL organization to '순환'
    const { error: error1 } = await supabase
        .from('users')
        .update({ organization: '순환' })
        .is('organization', null)

    if (error1) console.error("Error updating NULL to 순환:", error1.message)
    else console.log("Updated NULL organization to '순환'")

    // 2. Update '지원' organization to '관리'
    const { error: error2 } = await supabase
        .from('users')
        .update({ organization: '관리' })
        .eq('organization', '지원')

    if (error2) console.error("Error updating 지원 to 관리:", error2.message)
    else console.log("Updated '지원' organization to '관리'")

    // 3. Update '지원팀' group to '관리팀'
    const { error: error3 } = await supabase
        .from('groups')
        .update({ name: '관리팀' })
        .eq('name', '지원팀')

    if (error3) console.error("Error updating 지원팀 group to 관리팀:", error3.message)
    else console.log("Updated '지원팀' group to '관리팀'")

    console.log("Update complete.")
}

updateOrganizations()
