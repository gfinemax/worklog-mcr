
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function verifyRefactor() {
    const query = '손수민'
    console.log(`Testing search for: ${query} (using ONLY users table)`)

    const { data: users, error } = await supabase
        .from('users')
        .select('id, name, role, profile_image_url, type')
        .ilike('name', `%${query}%`)
        .limit(10)

    if (error) {
        console.error('Error:', error)
        return
    }

    const formattedUsers = (users || []).map((u: any) => ({
        ...u,
        type: u.type === 'support' ? 'external' : 'internal'
    }))

    console.log('Results:', formattedUsers)

    if (formattedUsers.length === 1 && formattedUsers[0].type === 'external') {
        console.log('SUCCESS: User found and correctly mapped to external.')
    } else {
        console.log('FAILURE: User not found or incorrect mapping.')
    }
}

verifyRefactor()
