
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkColumns() {
    // There isn't a direct API to getting columns easily without querying, 
    // but we can query one item and look at keys,
    // OR try to select * and see if it errors?
    // Better: use rpc if available, or just fetch one row.

    // Actually, usually we can just inspect one row.
    const { data, error } = await supabase.from('worklogs').select('*').limit(1);

    if (error) {
        console.error('Error fetching worklog:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns found:', Object.keys(data[0]));
    } else {
        console.log('No data found, cannot infer columns.');
    }
}

checkColumns();
