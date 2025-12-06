
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testDeduplication() {
    const query = '손수민'
    console.log(`Testing search for: ${query}`)

    const { data: users } = await supabase
        .from('users')
        .select('id, name, role, profile_image_url, type')
        .ilike('name', `%${query}%`)
        .limit(5)

    const { data: staff } = await supabase
        .from('support_staff')
        .select('id, name, role')
        .ilike('name', `%${query}%`)
        .limit(5)

    console.log('Raw Users:', users)
    console.log('Raw Staff:', staff)

    // Deduplication Logic (mirrors the component)
    const uniqueResults = new Map()

    if (users) {
        users.forEach((u: any) => {
            const uiType = u.type === 'support' ? 'external' : 'internal'
            uniqueResults.set(u.id, { ...u, type: uiType })
        })
    }

    if (staff) {
        staff.forEach((s: any) => {
            if (!uniqueResults.has(s.id)) {
                uniqueResults.set(s.id, { ...s, type: 'external', profile_image_url: null })
            }
        })
    }

    const results = Array.from(uniqueResults.values())
    console.log('Deduplicated Results:', results)

    if (results.length === 1 && results[0].type === 'external') {
        console.log('SUCCESS: Duplicate removed and type set to external.')
    } else {
        console.log('FAILURE: Deduplication or type mapping failed.')
    }
}

testDeduplication()
