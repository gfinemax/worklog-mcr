
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifyWorklogsColumns() {
    console.log('Verifying worklogs table columns...')

    const { data, error } = await supabase
        .from('worklogs')
        .select('*')
        .limit(1)

    if (error) {
        console.error('Error selecting worklogs:', error)
    } else {
        if (data && data.length > 0) {
            console.log('Columns found:', Object.keys(data[0]))
        } else {
            console.log('No worklogs found. Attempting to inspect via error message on invalid column select...')
            const { error: error2 } = await supabase
                .from('worklogs')
                .select('non_existent_column')
                .limit(1)
            if (error2) {
                console.log('Error on invalid column:', error2.message)
                // This doesn't give us the list of columns, but confirms table existence.
            }
        }
    }
}

verifyWorklogsColumns()
