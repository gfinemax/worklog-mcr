
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
    const { data: tables, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

    if (tableError) {
        // information_schema might not be accessible via API depending on settings, 
        // but usually it is blocked.
        console.log('Error accessing information_schema via API (expected):', tableError.message);

        // Try to infer by selecting from tables
        console.log('\n--- Testing Select from worklogs ---');
        const { data: worklogs, error: worklogsError } = await supabase.from('worklogs').select('*').limit(1);
        if (worklogsError) console.log('Error selecting worklogs:', worklogsError.message, worklogsError.details, worklogsError.hint);
        else console.log('Success selecting worklogs. Columns:', worklogs.length > 0 ? Object.keys(worklogs[0]) : 'No data');

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
                    id
                )
            `)
            .limit(1);
        if (relError) console.log('Error joining worklog_staff:', relError.message);
        else console.log('Success joining worklog_staff');

    } else {
        console.log('Tables:', tables.map(t => t.table_name));
    }
}

inspect();
