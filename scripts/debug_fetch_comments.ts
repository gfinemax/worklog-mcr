
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugFetch() {
    console.log('Debugging fetchComments...')

    // Get a post id
    const { data: posts } = await supabase.from('posts').select('id').limit(1)
    if (!posts?.length) {
        console.log('No posts found')
        return
    }
    const postId = posts[0].id
    console.log('Using post ID:', postId)

    // Try fetching comments with the exact query from store
    console.log('1. Fetching with author relation...')
    const { data: data1, error: error1 } = await supabase
        .from('comments')
        .select(`
            *,
            author:users(name)
        `)
        .eq('post_id', postId)

    if (error1) {
        console.error('Error 1:', JSON.stringify(error1, null, 2))
    } else {
        console.log('Data 1 length:', data1.length)
        if (data1.length > 0) console.log('Sample 1:', data1[0])
    }

    // Try fetching without relation
    console.log('2. Fetching without relation...')
    const { data: data2, error: error2 } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)

    if (error2) {
        console.error('Error 2:', JSON.stringify(error2, null, 2))
    } else {
        console.log('Data 2 length:', data2.length)
        if (data2.length > 0) console.log('Sample 2:', data2[0])
    }

    // Try to find the foreign key name if possible (hard with just client)
    // But if query 1 fails and 2 works, it's the relation.
}

debugFetch()
