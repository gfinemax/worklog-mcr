
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

async function testPriorities() {
    const logStream = fs.createWriteStream('error_log.txt', { flags: 'a' })
    const log = (msg: string) => {
        console.log(msg)
        logStream.write(msg + '\n')
    }

    log('Starting priority tests...')

    const { data: categories } = await supabase.from('categories').select('id').limit(1)
    const { data: users } = await supabase.from('users').select('id').limit(1)

    if (!categories?.length || !users?.length) {
        log('Missing dependencies')
        return
    }

    const basePost = {
        title: 'Constraint Test',
        content: 'Testing priority',
        category_id: categories[0].id,
        status: 'open',
        author_id: users[0].id
    }

    const priorities = ['normal', 'Normal', 'low', 'Low', '1', '0', '일반']

    for (const p of priorities) {
        log(`Testing priority: "${p}"`)
        const { data, error } = await supabase.from('posts').insert({ ...basePost, priority: p }).select()

        if (error) {
            log(`FAILED "${p}": ${error.message}`)
            if (error.details) log(`Details: ${error.details}`)
        } else {
            log(`SUCCESS "${p}": Created post with id ${data[0].id}`)
            await supabase.from('posts').delete().eq('id', data[0].id)
        }
    }

    log('Finished tests')
    logStream.end()
}

testPriorities()
