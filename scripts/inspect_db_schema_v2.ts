
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

async function inspect() {
    console.log('--- Checking Tables ---');

    // Try to infer by selecting from tables
    console.log('\n--- Testing Select from worklogs ---');
    const { data: worklogs, error: worklogsError } = await supabase.from('worklogs').select('workers').limit(1);
    if (worklogsError) console.log('Error selecting worklogs:', worklogsError.message);
    else console.log('Success selecting worklogs. Workers:', JSON.stringify(worklogs[0]?.workers, null, 2));

    console.log('\n--- Testing Select from worklog_staff ---');
    const { data: staff, error: staffError } = await supabase.from('worklog_staff').select('*').limit(1);
    if (staffError) console.log('Error selecting worklog_staff:', staffError.message);
    else console.log('Success selecting worklog_staff');

    console.log('\n--- Testing Relation worklogs -> worklog_staff ---');
    const { data: relData, error: relError } = await supabase
        .from('worklogs')
        .select(`
            id,
            worklog_staff (
                role
            )
        `)
        .limit(1);
    if (relError) console.log('Error joining worklog_staff:', relError.message);
    else console.log('Success joining worklog_staff');
}

inspect();
