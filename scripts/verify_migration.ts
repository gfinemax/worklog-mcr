
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

async function verifyMigration() {
    console.log('--- Verifying Migration ---');

    // Check users count by type
    const { data: users, error } = await supabase
        .from('users')
        .select('type, name, email')
        .order('type');

    if (error) {
        console.error('Error fetching users:', error);
        return;
    }

    const counts: Record<string, number> = {};
    users.forEach((u: any) => {
        const type = u.type || 'internal'; // Default to internal if null
        counts[type] = (counts[type] || 0) + 1;
    });

    console.log('User counts by type:', counts);

    console.log('\n--- Sample Support Users ---');
    const supportUsers = users.filter((u: any) => u.type === 'support');
    supportUsers.slice(0, 5).forEach((u: any) => console.log(`- ${u.name} (${u.email})`));
}

verifyMigration();
