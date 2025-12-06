
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables BEFORE importing other modules
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugLoginLogic() {
    // Dynamic import to ensure env vars are loaded
    const { shiftService } = await import('../lib/shift-rotation')

    console.log('--- Debugging Login Logic ---')
    const targetDate = new Date('2025-12-05')
    const targetGroup = '4조'
    // ... rest of the function ...

    console.log(`Target Date: ${targetDate.toISOString()}`)
    console.log(`Target Group: ${targetGroup}`)

    // 1. Get All Configs
    const { data: allConfigs } = await supabase
        .from('shift_pattern_configs')
        .select('id, valid_from, created_at, pattern_json')
        .order('created_at', { ascending: false })

    console.log('All Configs:', JSON.stringify(allConfigs?.map(c => ({
        id: c.id,
        valid_from: c.valid_from,
        created_at: c.created_at,
        day1_swap: c.pattern_json?.[0]?.A?.is_swap
    })), null, 2))

    const config = await shiftService.getConfig(targetDate)


    // 2. Calculate Shift
    const shiftInfo = shiftService.calculateShift(targetDate, targetGroup, config)
    console.log('Shift Info:', JSON.stringify(shiftInfo, null, 2))

    // Check pattern for the specific day
    const diffTime = Math.abs(targetDate.getTime() - new Date(config.valid_from).getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    const dayIndex = diffDays % config.cycle_length
    console.log(`Calculated Day Index: ${dayIndex} (Day ${dayIndex + 1})`)

    console.log('--- Full Pattern ---')
    config.pattern_json.forEach((p: any, i: number) => {
        console.log(`Day ${i + 1}: A=${p.A.team}(${p.A.is_swap ? 'SWAP' : 'Normal'}), N=${p.N.team}(${p.N.is_swap ? 'SWAP' : 'Normal'})`)
    })
    console.log('--------------------')


    // 3. Simulate Member Sorting and Assignment
    // Fetch members for 4조
    const { data: group } = await supabase.from('groups').select('id').eq('name', targetGroup).single()
    if (!group) {
        console.error('Group not found')
        return
    }

    const { data: memberData } = await supabase
        .from('group_members')
        .select(`
            user_id,
            role,
            users (
                id,
                name
            )
        `)
        .eq('group_id', group.id)

    if (!memberData) {
        console.error('No members found')
        return
    }

    console.log('Raw Members:', memberData.map((m: any) => `${m.users.name} (${m.role})`).join(', '))

    const initialMembers = memberData.map((m: any) => ({
        id: m.users.id,
        name: m.users.name,
        role: "영상", // Default
        originalRole: m.role
    }))

    const roleOrder: Record<string, number> = { "감독": 0, "부감독": 1, "영상": 2 }

    // First Sort (by static role)
    initialMembers.sort((a: any, b: any) => {
        const roleA = a.originalRole || "영상"
        const roleB = b.originalRole || "영상"
        const mainRoleA = roleA.split(',')[0].trim()
        const mainRoleB = roleB.split(',')[0].trim()
        return (roleOrder[mainRoleA] ?? 99) - (roleOrder[mainRoleB] ?? 99)
    })

    console.log('Sorted Members (Static):', initialMembers.map((m: any) => m.name).join(', '))

    // Apply Shift Roles
    const { director, assistant } = shiftInfo.roles
    console.log(`Applying Roles -> Director Index: ${director}, Assistant Index: ${assistant}`)

    if (initialMembers[director]) {
        initialMembers[director].role = "감독"
        console.log(`Assigned Director to: ${initialMembers[director].name}`)
    }
    if (initialMembers[assistant]) {
        initialMembers[assistant].role = "부감독"
        console.log(`Assigned Assistant to: ${initialMembers[assistant].name}`)
    }

    // Final Sort
    const rolePriority: Record<string, number> = { "감독": 1, "부감독": 2, "영상": 3 }
    initialMembers.sort((a: any, b: any) => (rolePriority[a.role] || 99) - (rolePriority[b.role] || 99))

    console.log('Final Session Members:', initialMembers.map((m: any) => `${m.name} (${m.role})`).join(', '))
}

debugLoginLogic()
