
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

async function checkPostWorklogs() {
    console.log('Checking post-worklog relationships...')

    // 1. Get posts with worklog_id
    const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('id, title, worklog_id')
        .not('worklog_id', 'is', null)
        .limit(10)

    if (postsError) {
        console.error('Error fetching posts:', postsError)
        return
    }

    console.log(`Found ${posts.length} posts with worklog_id.`)

    const results = []
    for (const post of posts) {
        const result: any = { post: { id: post.id, title: post.title, worklog_id: post.worklog_id } }

        // 2. Check if worklog exists
        const { data: worklog, error: worklogError } = await supabase
            .from('worklogs')
            .select('id, date, type, group_id')
            .eq('id', post.worklog_id)
            .single()

        if (worklogError) {
            result.error = worklogError.message
        } else if (worklog) {
            result.worklog = worklog
        } else {
            result.worklog = "NOT FOUND"
        }
        results.push(result)
    }
    console.log(JSON.stringify(results, null, 2))
}

checkPostWorklogs()
