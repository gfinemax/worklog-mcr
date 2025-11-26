
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectConstraints() {
    console.log('Inspecting constraints for posts table...')

    // We can't directly query information_schema via Supabase JS client easily if RLS is on or permissions are restricted.
    // However, we can try to use rpc if available, or just try to insert a dummy row to trigger the error and see if we can get more info (but we already have the error).
    // A better approach with Supabase JS is to try to infer it or use a raw query if we had a backend function.
    // Since we are running this locally with service role key (or anon key), we might be limited.
    // But wait, the user provided `scripts/verify_posts_table.ts` which uses the anon key.

    // Let's try to fetch from `pg_catalog` or `information_schema` using `rpc` if a function exists, 
    // but likely we don't have one.

    // Alternatively, we can try to guess the constraint by testing values.
    // But let's first try to see if we can read `information_schema` with the client.
    // Note: Supabase JS client `from` usually targets public tables. `information_schema` might not be exposed.

    // Actually, the best way might be to look at the error message again.
    // "new row for relation "posts" violates check constraint "posts_check""

    // Let's try to insert a row with different values to see what works.
    // If '일반' fails, maybe 'normal' works?

    const testPost = {
        title: 'Constraint Test',
        content: 'Testing constraints',
        category_id: '0014f6c3-bf0c-4968-b511-40427bdabdd3', // Using the ID from the error message if possible, or we need to fetch a valid one.
        priority: 'normal', // Try English
        status: 'open',
        author_id: '33b99ae7-beb5-42ec-b867-d1c9f416c7d5' // Using ID from error
    }

    // First fetch a valid category and author to be sure.
    const { data: categories } = await supabase.from('categories').select('id').limit(1)
    const { data: users } = await supabase.from('users').select('id').limit(1)

    if (!categories?.length || !users?.length) {
        console.error('Could not fetch category or user for testing')
        return
    }

    const validPost = {
        ...testPost,
        category_id: categories[0].id,
        author_id: users[0].id
    }

    console.log('Testing with priority: normal')
    const { error: errorNormal } = await supabase.from('posts').insert({ ...validPost, priority: 'normal' })
    if (errorNormal) {
        console.log('Priority "normal" failed:', errorNormal.message)
    } else {
        console.log('Priority "normal" succeeded!')
        // Clean up
        // await supabase.from('posts').delete().match({ title: 'Constraint Test' })
        return
    }

    console.log('Testing with priority: 일반')
    const { error: errorKorean } = await supabase.from('posts').insert({ ...validPost, priority: '일반' })
    if (errorKorean) {
        console.log('Priority "일반" failed:', errorKorean.message)
    } else {
        console.log('Priority "일반" succeeded!')
    }
}

inspectConstraints()
