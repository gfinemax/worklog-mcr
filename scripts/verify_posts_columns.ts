
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

async function verifyColumns() {
    console.log('Verifying posts table columns...')

    const { data, error } = await supabase
        .from('posts')
        .select('*')
        .limit(1)

    if (error) {
        console.error('Error selecting posts:', error)
    } else {
        if (data && data.length > 0) {
            console.log('Columns found:', Object.keys(data[0]))
        } else {
            console.log('No posts found, but query succeeded. Cannot verify columns from data.')
            // Try to insert a dummy to see error or just assume based on error message?
            // Actually, the error message in the screenshot was from PostgREST, so it knows the schema.
        }
    }
}

verifyColumns()
