
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugFetch() {
    const logStream = fs.createWriteStream('debug_fetch.log', { flags: 'w' })
    const log = (msg: string) => {
        console.log(msg)
        logStream.write(msg + '\n')
    }

    log('Debugging fetchComments...')

    // Get a post id
    const { data: posts } = await supabase.from('posts').select('id').limit(1)
    if (!posts?.length) {
        log('No posts found')
        return
    }
    const postId = posts[0].id
    log(`Using post ID: ${postId}`)

    // Try fetching comments with the exact query from store
    log('1. Fetching with author relation...')
    const { data: data1, error: error1 } = await supabase
        .from('comments')
        .select(`
            *,
            author:users(name)
        `)
        .eq('post_id', postId)

    if (error1) {
        log(`Error 1: ${JSON.stringify(error1, null, 2)}`)
    } else {
        log(`Data 1 length: ${data1.length}`)
        if (data1.length > 0) log(`Sample 1: ${JSON.stringify(data1[0], null, 2)}`)
    }

    // Try fetching without relation
    log('2. Fetching without relation...')
    const { data: data2, error: error2 } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)

    if (error2) {
        log(`Error 2: ${JSON.stringify(error2, null, 2)}`)
    } else {
        log(`Data 2 length: ${data2.length}`)
        if (data2.length > 0) log(`Sample 2: ${JSON.stringify(data2[0], null, 2)}`)
    }

    logStream.end()
}

debugFetch()
