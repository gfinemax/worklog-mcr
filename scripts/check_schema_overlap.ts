
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

async function checkSchemaAndOverlap() {
    console.log('Checking users table columns...')
    // We can't easily check columns via client, so we'll try to select * from one record
    const { data: userSample, error: userError } = await supabase
        .from('users')
        .select('*')
        .limit(1)

    if (userError) {
        console.error('Error fetching users:', userError)
    } else if (userSample && userSample.length > 0) {
        console.log('Users table columns:', Object.keys(userSample[0]))
    } else {
        console.log('Users table is empty or could not fetch sample.')
    }

    console.log('\nChecking distinct types in users table...')
    // This might fail if type column doesn't exist, but we expect it to
    const { data: distinctTypes, error: typeError } = await supabase
        .from('users')
        .select('type')

    if (typeError) {
        console.error('Error fetching types:', typeError)
    } else {
        const types = new Set(distinctTypes.map((u: any) => u.type))
        console.log('Distinct types found:', Array.from(types))
    }

    console.log('\nChecking overlap between support_staff and users...')
    const { data: allSupport, error: supportError } = await supabase
        .from('support_staff')
        .select('*')

    if (supportError) {
        console.error('Error fetching support_staff:', supportError)
        return
    }

    if (!allSupport || allSupport.length === 0) {
        console.log('support_staff table is empty.')
        return
    }

    let missingInUsers = 0
    for (const staff of allSupport) {
        const { data: match } = await supabase
            .from('users')
            .select('id')
            .eq('name', staff.name) // Matching by name as ID might differ if not synced
            .maybeSingle()

        if (!match) {
            console.log(`Missing in users: ${staff.name}`)
            missingInUsers++
        }
    }

    console.log(`\nTotal support_staff: ${allSupport.length}`)
    console.log(`Missing in users: ${missingInUsers}`)

    if (missingInUsers === 0) {
        console.log('CONCLUSION: All support_staff records exist in users table (by name).')
    } else {
        console.log('CONCLUSION: Some support_staff records are NOT in users table.')
    }
}

checkSchemaAndOverlap()
