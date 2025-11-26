
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkColumns() {
    console.log('Checking for parent_id and reactions columns...')
    const { data, error } = await supabase
        .from('comments')
        .select('parent_id, reactions')
        .limit(1)

    if (error) {
        console.log('Columns likely do not exist. Error:', error.message)
    } else {
        console.log('Columns exist!')
    }
}

checkColumns()
