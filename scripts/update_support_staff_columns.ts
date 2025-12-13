import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load env
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8')
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=')
        if (key && value) {
            process.env[key.trim()] = value.trim()
        }
    })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updateSupportStaffColumns() {
    console.log('Updating support_staff table columns...')

    try {
        // 1. Rename role to 담당
        const { error: renameError } = await supabase.rpc('exec_sql', {
            sql: 'ALTER TABLE public.support_staff RENAME COLUMN role TO 담당;'
        })

        if (renameError) {
            console.error('Error renaming column:', renameError)
        } else {
            console.log('Renamed role to 담당')
        }

        // 2. Add 회사 column
        const { error: addCompanyError } = await supabase.rpc('exec_sql', {
            sql: 'ALTER TABLE public.support_staff ADD COLUMN IF NOT EXISTS 회사 TEXT;'
        })

        if (addCompanyError) {
            console.error('Error adding 회사 column:', addCompanyError)
        } else {
            console.log('Added 회사 column')
        }

        // 3. Add 분류 column
        const { error: addCategoryError } = await supabase.rpc('exec_sql', {
            sql: 'ALTER TABLE public.support_staff ADD COLUMN IF NOT EXISTS 분류 TEXT;'
        })

        if (addCategoryError) {
            console.error('Error adding 분류 column:', addCategoryError)
        } else {
            console.log('Added 분류 column')
        }

        console.log('Update completed successfully')

    } catch (error) {
        console.error('Unexpected error:', error)
    }
}

updateSupportStaffColumns()