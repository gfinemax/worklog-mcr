
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { ShiftRotationService } from '../lib/shift-rotation'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyShift() {
    console.log('Verifying shift for 2025-12-06...')

    const shiftService = new ShiftRotationService(supabase)
    const config = await shiftService.getConfig()

    if (!config) {
        console.error('No shift config found')
        return
    }

    const targetDate = new Date('2025-12-06T12:00:00') // Noon to be safe
    const teams = shiftService.getTeamsForDate(targetDate, config)

    console.log('--------------------------------')
    console.log('Date: 2025-12-06')
    console.log('Day Shift Team (A):', teams?.A)
    console.log('Night Shift Team (N):', teams?.N)
    console.log('--------------------------------')

    // Also fetch the existing worklogs to see IDs
    const { data: worklogs } = await supabase
        .from('worklogs')
        .select('id, date, type, group_name, status')
        .eq('date', '2025-12-06')
        .eq('type', '주간')

    console.log('Existing Worklogs for 2025-12-06 (Day):')
    console.table(worklogs)
}

verifyShift()
