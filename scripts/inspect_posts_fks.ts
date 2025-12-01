
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function inspectForeignKeys() {
    const { data, error } = await supabase
        .rpc('get_foreign_keys', { table_name: 'posts' })

    // If RPC fails (likely not defined), try direct query if possible or just list constraints
    // Since we can't easily query information_schema via JS client without setup, 
    // let's try to just select from posts without the hint and see if it works with default detection,
    // or use a raw SQL query via a script if I had SQL access.

    // Alternative: just check the columns to ensure created_by exists
    const { data: columns, error: colError } = await supabase
        .from('posts')
        .select('*')
        .limit(1)

    if (colError) {
        console.log('Error fetching posts:', colError)
    } else {
        console.log('Posts columns:', Object.keys(columns[0] || {}))
    }
}

// Since I can't easily run SQL, I will try to guess the FK or just fetch the user manually in two steps.
// Step 1: Get post
// Step 2: Get user by ID
async function fetchManual() {
    const { data: posts, error } = await supabase
        .from('posts')
        .select(`
      id, 
      title, 
      author_id, 
      created_by, 
      worklog_id
    `)
        .order('created_at', { ascending: false })
        .limit(1)

    if (error) {
        console.log('Error:', error)
        return
    }

    const post = posts[0]
    console.log('Post:', JSON.stringify(post, null, 2))

    if (post.created_by) {
        const { data: user, error: userError } = await supabase
            .from('users')
            .select('name')
            .eq('id', post.created_by)
            .single()

        console.log('Creator:', user)
    }
}

fetchManual()
