
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

async function seedGroups() {
    console.log('Seeding groups...')

    const groupsToSeed = ['1조', '2조', '3조']

    for (const name of groupsToSeed) {
        // Check if exists
        const { data: existing } = await supabase.from('groups').select('id').eq('name', name).single()

        if (!existing) {
            console.log(`Creating group: ${name}`)
            const { error } = await supabase.from('groups').insert({
                name: name,
                description: `${name} 근무조`
            })

            if (error) {
                console.error(`Error creating ${name}:`, error)
            } else {
                console.log(`Created ${name}`)
            }
        } else {
            console.log(`Group ${name} already exists`)
        }
    }

    console.log('Seeding complete.')
}

seedGroups()
