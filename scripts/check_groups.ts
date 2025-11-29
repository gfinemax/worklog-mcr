
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkGroups() {
    console.log('Checking groups table...')
    const { data, error } = await supabase.from('groups').select('*')

    if (error) {
        console.error('Error fetching groups:', error)
    } else {
        console.log(`Found ${data.length} groups:`)
        data.forEach(g => console.log(`- ${g.name} (ID: ${g.id})`))
    }
}

checkGroups()
