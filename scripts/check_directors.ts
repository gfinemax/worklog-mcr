
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDirectors() {
    console.log('Fetching Directors for all groups...')

    const { data, error } = await supabase
        .from('group_members')
        .select(`
            role,
            groups (name),
            users (name, email)
        `)
        .eq('role', '감독')
        .order('groups(name)')

    if (error) {
        console.error('Error:', error)
        return
    }

    data.forEach((m: any) => {
        console.log(`Group: ${m.groups.name}, Director: ${m.users.name}, Email: ${m.users.email}`)
    })
}

checkDirectors()
