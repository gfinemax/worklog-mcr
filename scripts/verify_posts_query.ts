
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

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
    }

    env[key] = value
})

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']
const supabaseAnonKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY']

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials (URL or Anon Key)')
    process.exit(1)
}

console.log('Using Supabase URL:', supabaseUrl)
console.log('Using Anon Key (starts with):', supabaseAnonKey.substring(0, 10))

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function verifyPostsQuery() {
    console.log('Verifying posts query with Anon Key...')

    const { data, error } = await supabase
        .from('posts')
        .select(`
            *,
            author:users!posts_author_user_id_fkey(name),
            category:categories(name, slug),
            worklog:worklogs(work_date, shift_type, group:groups(name))
        `)
        .order('created_at', { ascending: false })
        .limit(5)

    if (error) {
        console.error('Query failed:', JSON.stringify(error, null, 2))
    } else {
        console.log('Query succeeded. Fetched', data.length, 'posts.')
        if (data.length > 0) {
            console.log('First post:', JSON.stringify(data[0], null, 2))
        }
    }
}

verifyPostsQuery()
