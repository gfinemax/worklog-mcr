
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkUsers() {
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .limit(20)

    if (error) {
        console.error('Error fetching users:', error)
        return
    }

    console.error('Found Users:')
    users.forEach(u => {
        console.error(`Name: ${u.name}, Email: ${u.email}, ID: ${u.id}`)
    })
}

checkUsers()
