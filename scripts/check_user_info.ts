
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const envPath = path.resolve(process.cwd(), '.env.local')
const envConfig = fs.readFileSync(envPath, 'utf8')
const env: any = {}
envConfig.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) env[key.trim()] = value.trim()
})

const supabase = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkUser() {
    const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'sonsm@mbcplus.com')

    if (error) {
        console.error('Error:', error)
        return
    }

    console.log('User Info:', JSON.stringify(users, null, 2))
}

checkUser()
