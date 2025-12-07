
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function inspectWorklog() {
    const today = new Date().toISOString().split('T')[0]
    console.log(`Checking worklogs for today: ${today}`)

    const { data: worklogs, error } = await supabase
        .from('worklogs')
        .select('*, groups(name)')
        .eq('date', today)
    //.eq('group_name', '1조')

    if (error || !worklogs || worklogs.length === 0) {
        console.log('No worklogs found for today.')
        return
    }

    const targetLog = worklogs.find(w => w.group_name === '1조' || w.groups?.name === '1조')

    if (targetLog) {
        console.log('Found 1조 Worklog:', targetLog.id)
        console.log('Workers JSON:', JSON.stringify(targetLog.workers, null, 2))
    } else {
        console.log('No 1조 worklog found. Available groups:', worklogs.map(w => w.group_name || w.groups?.name))
    }
}

inspectWorklog()
