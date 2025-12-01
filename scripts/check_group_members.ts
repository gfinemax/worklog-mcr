
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function checkMembers() {
    console.log('--- Checking Group Members ---');

    // Fetch all users
    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, name, email');

    if (usersError) {
        console.error('Error fetching users:', usersError);
        return;
    }

    const userMap = new Map(users.map((u: any) => [u.id, u]));

    // Fetch all groups
    const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select('id, name');

    if (groupsError) {
        console.error('Error fetching groups:', groupsError);
        return;
    }
    const groupMap = new Map(groups.map((g: any) => [g.id, g]));

    // Fetch group members
    const { data: members, error } = await supabase
        .from('group_members')
        .select('*')
        .order('group_id')
        .order('role');

    if (error) {
        console.error('Error fetching members:', error);
        return;
    }

    const grouped: Record<string, any[]> = {};
    members.forEach((m: any) => {
        const groupName = groupMap.get(m.group_id)?.name || 'Unknown Group';
        const user = userMap.get(m.user_id);
        const userName = user?.name || 'Unknown User';
        const userEmail = user?.email || 'No Email';

        if (!grouped[groupName]) grouped[groupName] = [];
        grouped[groupName].push(`${userName} (${m.role}) - ${userEmail}`);
    });

    for (const [group, users] of Object.entries(grouped)) {
        console.log(`\n[${group}]`);
        users.forEach(u => console.log(`  - ${u}`));
    }
}

checkMembers();
