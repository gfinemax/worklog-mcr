
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

async function verifySchema() {
    console.log('Verifying posts table schema...')

    // We can't easily inspect schema with supabase-js client directly without admin rights or specific functions.
    // Instead, we'll try to insert a dummy post with a tag and see if it fails, 
    // OR just select the tags column from an existing post.

    // Try to select tags from posts
    const { data, error } = await supabase
        .from('posts')
        .select('tags')
        .limit(1)

    if (error) {
        console.error('Error selecting tags column:', error)
        if (error.message.includes('does not exist')) {
            console.error('CONFIRMED: tags column is missing!')
        }
    } else {
        console.log('Successfully selected tags column. Column exists.')
        console.log('Data sample:', data)
    }
}

verifySchema()
