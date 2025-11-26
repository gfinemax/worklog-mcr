
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

async function testNormal() {
    console.log('Testing priority: normal')

    // Fetch valid foreign keys
    const { data: categories } = await supabase.from('categories').select('id').limit(1)
    const { data: users } = await supabase.from('users').select('id').limit(1)

    if (!categories?.length || !users?.length) {
        console.error('Missing dependencies')
        return
    }

    const post = {
        title: 'Constraint Test Normal',
        content: 'Testing normal priority',
        category_id: categories[0].id,
        priority: 'normal',
        status: 'open',
        author_id: users[0].id
    }

    const { data, error } = await supabase.from('posts').insert(post).select()

    if (error) {
        console.error('FAILED:', error.message)
    } else {
        console.log('SUCCESS: Created post with id', data[0].id)
        // Cleanup
        await supabase.from('posts').delete().eq('id', data[0].id)
    }
}

testNormal()
