
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Manually read .env.local
const envPath = path.resolve(__dirname, '../.env.local')
let envConfig = ''
try {
    envConfig = fs.readFileSync(envPath, 'utf8')
} catch (e) {
    console.error('Could not read .env.local', e)
    process.exit(1)
}

const env: { [key: string]: string } = {}

envConfig.split(/\r?\n/).forEach(line => {
    line = line.trim()
    if (!line || line.startsWith('#')) return

    const delimiterIndex = line.indexOf('=')
    if (delimiterIndex === -1) return

    const key = line.substring(0, delimiterIndex).trim()
    let value = line.substring(delimiterIndex + 1).trim()

    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
    }

    env[key] = value
})

console.log('Found env keys:')
Object.keys(env).forEach(k => console.log(`- ${k}`))

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']
const supabaseServiceKey = env['SUPABASE_SERVICE_ROLE_KEY'] || env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials (URL or Key)')
    process.exit(1)
}

console.log('Using Supabase URL:', supabaseUrl)
console.log('Using Key (starts with):', supabaseServiceKey.substring(0, 10))

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createUnlinkedPost() {
    const worklogId = '96964bbe-51c2-4138-9587-4695d79a73bb'
    const channel = 'MBC SPORTS+'

    console.log(`Creating unlinked post for worklog: ${worklogId}, channel: ${channel}`)

    // 1. Get a category ID (e.g., 'channel-operation')
    const { data: categories } = await supabase.from('categories').select('id').eq('slug', 'channel-operation').single()
    const categoryId = categories?.id

    if (!categoryId) {
        console.error('Category not found')
        return
    }

    // 2. Get a user ID (author)
    const { data: users } = await supabase.from('users').select('id').limit(1).single()
    const authorId = users?.id

    if (!authorId) {
        console.error('User not found')
        return
    }

    // 3. Insert Post
    const { data: post, error } = await supabase
        .from('posts')
        .insert({
            worklog_id: worklogId,
            category_id: categoryId,
            author_id: authorId,
            title: 'Unlinked Post Verification',
            content: 'This post should be recovered automatically.',
            summary: 'Unlinked Post Verification',
            priority: '일반',
            status: 'open',
            channel: channel,
            tags: ['verification']
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating post:', error)
        return
    }

    console.log('Successfully created unlinked post:', post.id)
    console.log('Verify at: http://localhost:3000/worklog?id=' + worklogId)
}

createUnlinkedPost()
