
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkColumns() {
    console.log('Checking columns for "posts" table...')

    // Try to select the author_id column specifically
    const { data, error } = await supabase
        .from('posts')
        .select('author_id')
        .limit(1)

    if (error) {
        console.error('Error selecting author_id:', error)
        if (error.message.includes('does not exist') || error.code === 'PGRST204') {
            console.log('CONFIRMED: author_id column is missing or not visible.')
        }
    } else {
        console.log('Success! author_id column exists.')
    }

    // Also try to reload schema cache just in case
    console.log('Attempting to reload schema cache...')
    const { error: rpcError } = await supabase.rpc('reload_schema')
    if (rpcError) {
        // This might fail if the function doesn't exist, which is expected.
        // We can try a raw query if we had service role, but with anon key we are limited.
        // However, the error above is the most telling.
        console.log('Could not reload schema via RPC (expected if function not defined).')
    }
}

checkColumns()
