
import { shiftService } from '../lib/shift-rotation'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

async function test() {
    try {
        console.log("Fetching config...")
        const config = await shiftService.getConfig()
        console.log("Config fetched:", config ? "Yes" : "No")

        if (config) {
            console.log("Calculating shift for '지원팀'...")
            const result = shiftService.calculateShift(new Date(), '지원팀', config)
            console.log("Result:", result)
        }
    } catch (e: any) {
        console.error("CRASHED:", e.message)
        console.error(e.stack)
    }
}

test()
