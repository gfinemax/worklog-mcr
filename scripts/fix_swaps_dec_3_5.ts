
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.resolve(process.cwd(), '.env.local')
const envConfig = fs.readFileSync(envPath, 'utf8')
const env: any = {}
envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) env[key.trim()] = value.trim()
})

const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function fixSwaps() {
    console.log("Fixing swaps for Dec 3 and 5...")

    // 1. Dec 3rd, 2조, Day
    // Swap: Director <-> Assistant
    // Current: D=황동성, A=이석훈, V=강한강
    // Target: D=이석훈, A=황동성, V=강한강
    const update1 = {
        director: ['이석훈'],
        assistant: ['황동성'],
        video: ['강한강']
    }
    const { error: e1 } = await supabase
        .from('worklogs')
        .update({ workers: update1 })
        .eq('date', '2025-12-03')
        .eq('group_name', '2조')
        .eq('type', '주간')

    if (e1) console.error("Error fixing Dec 3:", e1)
    else console.log("Fixed Dec 3 (2조 Swap)")

    // 2. Dec 5th, 4조, Day
    // Swap: Director <-> Assistant
    // Current: D=권영춘, A=김희성, V=심창규
    // Target: D=김희성, A=권영춘, V=심창규
    const update2 = {
        director: ['김희성'],
        assistant: ['권영춘'],
        video: ['심창규']
    }
    const { error: e2 } = await supabase
        .from('worklogs')
        .update({ workers: update2 })
        .eq('date', '2025-12-05')
        .eq('group_name', '4조')
        .eq('type', '주간')

    if (e2) console.error("Error fixing Dec 5:", e2)
    else console.log("Fixed Dec 5 (4조 Swap)")
}

fixSwaps()
