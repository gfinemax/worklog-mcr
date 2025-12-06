
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

async function registerAndAssign() {
    const email = 'limkh@mbcplus.com'
    const password = '12341234'
    const name = '임근형'

    // 1. Create Auth User
    console.log(`Creating Auth User for ${email}...`)
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } }
    })

    if (authError) {
        console.log("Auth Error (User might exist):", authError.message)
        // If user exists, we need to find their ID to proceed with public profile
        // But we can't search Auth users with Anon key.
        // So assuming we just created them or they exist. 
        // If they exist, we can't get the ID without login.
        // Let's try log in to get ID
        const { data: loginData } = await supabase.auth.signInWithPassword({ email, password })
        if (loginData.user) {
            console.log("Logged in existing user, ID:", loginData.user.id)
            await setupProfile(loginData.user.id)
        } else {
            console.error("Could not get Auth User ID.")
        }
        return
    }

    if (authData.user) {
        console.log("Created User ID:", authData.user.id)
        await setupProfile(authData.user.id)
    }

    async function setupProfile(userId: string) {
        // 2. Handle Public Profile
        // Delete old profile if exists (lim2@example.com) to avoid confusion? 
        // Or just leave it. Let's try to delete for cleanliness but ignore error.
        const { error: deleteError } = await supabase.from('users').delete().eq('name', '임근형').neq('id', userId)
        if (deleteError) console.log("Old profile delete skipped (likely FKs)")
        else console.log("Old profile deleted.")

        // Upsert New Profile
        const { error: upsertError } = await supabase.from('users').upsert({
            id: userId,
            email: email,
            name: name,
            type: 'support',
            role: 'director',
            organization: '지원',
            status: 'active'
        })
        if (upsertError) console.error("Profile Upsert Error:", upsertError)
        else console.log("Profile Upserted.")

        // 3. Assign to '지원팀'
        const { data: supportGroup } = await supabase
            .from('groups')
            .select('id')
            .eq('name', '지원팀')
            .single()

        if (supportGroup) {
            const { error: memberError } = await supabase.from('group_members').upsert({
                group_id: supportGroup.id,
                user_id: userId,
                role: 'director'
            }, { onConflict: 'group_id, user_id' })

            if (memberError) console.error("Group Assign Error:", memberError)
            else console.log("Assigned to 지원팀.")
        } else {
            console.error("지원팀 not found.")
        }
    }
}

registerAndAssign()
