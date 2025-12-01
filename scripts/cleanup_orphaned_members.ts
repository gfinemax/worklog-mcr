
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

async function cleanupOrphans() {
    console.log('--- Cleaning up Orphaned Group Members ---');

    // 1. Get all valid user IDs
    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id');

    if (usersError) {
        console.error('Error fetching users:', usersError);
        return;
    }
    const validUserIds = new Set(users.map((u: any) => u.id));

    // 2. Get all group members
    const { data: members, error: membersError } = await supabase
        .from('group_members')
        .select('id, user_id');

    if (membersError) {
        console.error('Error fetching members:', membersError);
        return;
    }

    // 3. Identify orphans
    const orphans = members.filter((m: any) => !validUserIds.has(m.user_id));
    console.log(`Found ${orphans.length} orphaned members.`);

    if (orphans.length > 0) {
        const orphanIds = orphans.map((m: any) => m.id);
        const { error: deleteError } = await supabase
            .from('group_members')
            .delete()
            .in('id', orphanIds);

        if (deleteError) {
            console.error('Error deleting orphans:', deleteError);
        } else {
            console.log(`Successfully deleted ${orphans.length} orphaned members.`);
        }
    } else {
        console.log('No orphans found.');
    }
}

cleanupOrphans();
