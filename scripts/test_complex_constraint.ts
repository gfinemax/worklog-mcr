
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

async function testComplex() {
    const logStream = fs.createWriteStream('complex_log.txt', { flags: 'w' })
    const log = (msg: string) => {
        console.log(msg)
        logStream.write(msg + '\n')
    }

    log('Starting complex constraint tests...')

    const { data: categories } = await supabase.from('categories').select('id').limit(1)
    const { data: users } = await supabase.from('users').select('id').limit(1)

    if (!categories?.length || !users?.length) {
        log('Missing dependencies')
        return
    }

    const basePost = {
        title: 'Constraint Test Complex',
        content: 'Testing complex constraints',
        category_id: categories[0].id,
        status: 'open',
        author_id: users[0].id
    }

    // Test 1: Check if is_emergency column exists
    log('Test 1: Insert with is_emergency: false')
    const { error: error1 } = await supabase.from('posts').insert({ ...basePost, priority: '일반', is_emergency: false })
    if (error1) {
        log(`Test 1 Failed: ${error1.message}`)
        if (error1.message.includes('column "is_emergency" of relation "posts" does not exist')) {
            log('Result: is_emergency column DOES NOT exist')
        } else {
            log('Result: is_emergency column EXISTS (or other error)')
        }
    } else {
        log('Test 1 Success: is_emergency column EXISTS and accepted false')
    }

    // Test 2: Insert with is_emergency: true
    log('Test 2: Insert with is_emergency: true')
    const { error: error2 } = await supabase.from('posts').insert({ ...basePost, priority: '긴급', is_emergency: true })
    if (error2) {
        log(`Test 2 Failed: ${error2.message}`)
    } else {
        log('Test 2 Success: Accepted is_emergency: true with priority: 긴급')
    }

    // Test 3: Try English priority with is_emergency
    log('Test 3: Insert with is_emergency: true, priority: urgent')
    const { error: error3 } = await supabase.from('posts').insert({ ...basePost, priority: 'urgent', is_emergency: true })
    if (error3) {
        log(`Test 3 Failed: ${error3.message}`)
    } else {
        log('Test 3 Success: Accepted is_emergency: true with priority: urgent')
    }

    logStream.end()
}

testComplex()
