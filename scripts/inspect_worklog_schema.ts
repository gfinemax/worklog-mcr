
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectWorklog() {
    const { data, error } = await supabase
        .from('worklogs')
        .select('*')
        .limit(1)
        .single();

    if (error) {
        console.error('Error fetching worklog:', error);
        return;
    }

    console.log('Worklog Schema/Data:', JSON.stringify(data, null, 2));
}

inspectWorklog();
