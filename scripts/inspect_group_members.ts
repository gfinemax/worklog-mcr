
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function inspectGroupMembers() {
    const groupName = '5조'
    console.log(`Inspecting members for group: ${groupName}`)

    // 1. Get Group ID
    const { data: group, error: groupError } = await supabase
        .from('groups')
        .select('id, name')
        .eq('name', groupName)
        .single()

    if (groupError || !group) {
        console.error('Error fetching group:', groupError)
        return
    }

    console.log(`Group ID: ${group.id}`)

    // 2. Get Members
    const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select(`
      user_id,
      role,
      users (
        id,
        name,
        email
      )
    `)
        .eq('group_id', group.id)

    if (membersError) {
        console.error('Error fetching members:', membersError)
        return
    }

    let output = ''
    console.log('Members:')
    members.forEach((m: any) => {
        const line = `- Name: ${m.users.name}, Role: '${m.role}', Email: ${m.users.email}\n`
        output += line
        console.log(line.trim())
    })

    fs.writeFileSync(path.resolve(__dirname, 'output.txt'), output)
    console.log('Output written to scripts/output.txt')
}

inspectGroupMembers()
