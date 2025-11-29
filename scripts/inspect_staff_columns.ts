
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
    console.log('\n--- Testing Select from worklog_staff ---');
    const { data: staff, error: staffError } = await supabase.from('worklog_staff').select('*').limit(1);
    if (staffError) console.log('Error selecting worklog_staff:', staffError.message);
    else console.log('Success selecting worklog_staff. Columns:', staff.length > 0 ? Object.keys(staff[0]) : 'No data');
}

inspect();
