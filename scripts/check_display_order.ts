
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDisplayOrder() {
    const { data: group } = await supabase.from('groups').select('id').eq('name', '1조').single()
    if (!group) return

    const { data: members } = await supabase
        .from('group_members')
        .select(`
            display_order,
            role,
            users (name)
        `)
        .eq('group_id', group.id)
        .order('display_order', { ascending: true })

    console.log('4조 Members (Ordered by display_order):')
    members?.forEach((m: any) => {
        console.log(`${m.display_order}: ${m.users.name} (${m.role})`)
    })
}

checkDisplayOrder()
