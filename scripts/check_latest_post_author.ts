
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkLatestPost() {
    const { data: posts, error } = await supabase
        .from('posts')
        .select(`
      id, 
      title, 
      author_id, 
      created_by, 
      worklog_id,
      creator:users!posts_created_by_fkey(name)
    `)
        .order('created_at', { ascending: false })
        .limit(1)

    if (error) {
        fs.writeFileSync('latest_post_info.json', JSON.stringify({ error }, null, 2))
        return
    }

    if (posts && posts.length > 0) {
        fs.writeFileSync('latest_post_info.json', JSON.stringify(posts[0], null, 2))
    } else {
        fs.writeFileSync('latest_post_info.json', JSON.stringify({ message: 'No posts found' }, null, 2))
    }
}

checkLatestPost()
