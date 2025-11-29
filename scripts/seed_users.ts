import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Key')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const GROUPS = [
    { name: '1조', description: '1조입니다.', shift_pattern: 'ANSYY' },
    { name: '2조', description: '2조입니다.', shift_pattern: 'ANSYY' },
    { name: '3조', description: '3조입니다.', shift_pattern: 'ANSYY' },
    { name: '4조', description: '4조입니다.', shift_pattern: 'ANSYY' },
    { name: '5조', description: '5조입니다.', shift_pattern: 'ANSYY' },
]

const WORKERS = [
    // 1조
    { name: '정광훈', group: '1조', role: '감독', id: 'jungkh' },
    { name: '오동섭', group: '1조', role: '부감독', id: 'ohds' },
    { name: '김단언', group: '1조', role: '영상', id: 'kimde' },
    // 2조
    { name: '황동성', group: '2조', role: '감독', id: 'hwangds' },
    { name: '이석훈', group: '2조', role: '부감독', id: 'leesh' },
    { name: '강한강', group: '2조', role: '영상', id: 'kanghk' },
    // 3조
    { name: '남궁장', group: '3조', role: '감독', id: 'namgj' },
    { name: '이종원', group: '3조', role: '부감독', id: 'leejw' },
    { name: '윤주현', group: '3조', role: '영상', id: 'yoonjh' },
    // 4조
    { name: '권영춘', group: '4조', role: '감독', id: 'kwonyc' },
    { name: '김희성', group: '4조', role: '부감독', id: 'kimhs' },
    { name: '심창규', group: '4조', role: '영상', id: 'shimcg' },
    { name: '천남웅', group: '4조', role: '영상', id: 'cheonnu' },
    // 5조
    { name: '김준일', group: '5조', role: '감독', id: 'kimji' },
    { name: '박상필', group: '5조', role: '부감독', id: 'parksp' },
    { name: '김소연', group: '5조', role: '영상', id: 'kimsy' },
]

// [변경점] 오학동(admin) 님을 여기에 추가했습니다.
const SUPPORT_STAFF = [
    { name: '오학동', role: '관리', email: 'admin@mbcplus.com' }, // 👈 추가됨
    { name: '손수민', role: '관리', email: 'son@example.com' },
    { name: '임제혁', role: '기술스텝', email: 'lim@example.com' },
    { name: '임근형', role: '기술스텝', email: 'lim2@example.com' },
]

async function seed() {
    console.log('Starting seed process...')

    // 1. Create Groups
    console.log('1. Seeding Groups...')
    for (const group of GROUPS) {
        const { data: existingGroup } = await supabase
            .from('groups')
            .select('id')
            .eq('name', group.name)
            .single()

        if (!existingGroup) {
            const { error } = await supabase
                .from('groups')
                .insert({
                    name: group.name,
                    description: group.description,
                    shift_pattern: group.shift_pattern
                })

            if (error) console.error(`Error creating group ${group.name}:`, error.message)
            else console.log(`Group ${group.name} created.`)
        } else {
            console.log(`Group ${group.name} already exists.`)
        }
    }

    // 2. Create Internal Workers
    console.log('2. Seeding Internal Workers...')
    for (const worker of WORKERS) {
        const email = `${worker.id}@mbcplus.com`
        const password = 'password1234'

        // A. Sign Up (Auth)
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name: worker.name }
            }
        })

        if (authError) {
            console.log(`Auth signup error for ${worker.name}: ${authError.message}`)
        }

        let userId = authData.user?.id
        if (!userId) {
            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password })
            if (loginError) {
                console.log(`Login failed for ${worker.name}: ${loginError.message}`)
            }
            userId = loginData.user?.id
        }

        if (userId) {
            // B. Create/Update Profile (Users Table)
            const { error: profileError } = await supabase
                .from('users')
                .upsert({
                    id: userId,
                    email: email,
                    name: worker.name,
                    role: worker.role,
                    // is_active: true
                })

            if (profileError) console.error(`Error updating profile for ${worker.name}:`, profileError.message)

            // C. Assign to Group
            const { data: groupData } = await supabase
                .from('groups')
                .select('id')
                .eq('name', worker.group)
                .single()

            if (groupData) {
                const { error: memberError } = await supabase
                    .from('group_members')
                    .upsert({
                        group_id: groupData.id,
                        user_id: userId,
                        role: worker.role
                    }, { onConflict: 'group_id,user_id' })

                if (memberError) console.error(`Error assigning ${worker.name} to ${worker.group}:`, memberError.message)
                else console.log(`User ${worker.name} assigned to ${worker.group} (Email: ${email}).`)
            }
        } else {
            console.error(`Could not get ID for ${worker.name}`)
        }
    }

    // 3. Create Support Staff
    console.log('3. Seeding Support Staff...')
    for (const staff of SUPPORT_STAFF) {
        const { data: existingStaff } = await supabase
            .from('support_staff')
            .select('id')
            .eq('name', staff.name)
            .single()

        if (!existingStaff) {
            const { error } = await supabase
                .from('support_staff')
                .insert({
                    name: staff.name,
                    email: staff.email,
                    role: staff.role,
                    organization: '지원',
                    is_active: true
                })

            if (error) console.error(`Error creating support staff ${staff.name}:`, error.message)
            else console.log(`Support staff ${staff.name} created.`)
        } else {
            const { error } = await supabase
                .from('support_staff')
                .update({
                    email: staff.email,
                    role: staff.role,
                    organization: '지원'
                })
                .eq('name', staff.name)

            if (error) console.error(`Error updating support staff ${staff.name}:`, error.message)
            else console.log(`Support staff ${staff.name} updated.`)
        }
    }

    console.log('Seed process completed.')
}

seed()