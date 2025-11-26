
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

async function inspectComments() {
    console.log('Inspecting comments table...')

    // Try to insert a comment to see the error
    // We need a valid post_id and author_id

    const { data: posts } = await supabase.from('posts').select('id').limit(1)
    const { data: users } = await supabase.from('users').select('id').limit(1)

    if (!posts?.length || !users?.length) {
        console.error('Missing posts or users to test comments')
        return
    }

    const comment = {
        post_id: posts[0].id,
        author_id: users[0].id,
        content: 'Test comment'
    }

    console.log('Attempting to insert comment:', comment)
    const { data, error } = await supabase.from('comments').insert(comment).select()

    if (error) {
        console.error('Error inserting comment:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
    } else {
        console.log('Successfully inserted comment:', data)
        // Cleanup
        await supabase.from('comments').delete().eq('id', data[0].id)
    }

    // Try to fetch comments
    console.log('Attempting to fetch comments...')
    const { data: comments, error: fetchError } = await supabase.from('comments').select('*').limit(1)

    if (fetchError) {
        console.error('Error fetching comments:', fetchError)
    } else {
        console.log('Successfully fetched comments')
    }
}

inspectComments()
