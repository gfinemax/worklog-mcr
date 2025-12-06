
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSessionData() {
    // Check work_session_members columns
    const { data: members, error: membersError } = await supabase
        .from('work_session_members')
        .select('*')
        .limit(1);

    if (membersError) {
        console.log('Error fetching work_session_members:', membersError.message);
    } else {
        console.log('work_session_members sample:', JSON.stringify(members, null, 2));
    }

    // Check worklogs with session_id
    const { data: logs, error: logsError } = await supabase
        .from('worklogs')
        .select('id, session_id, date')
        .not('session_id', 'is', null)
        .limit(5);

    if (logsError) {
        console.log('Error fetching worklogs with session_id:', logsError.message);
    } else {
        console.log('Worklogs with session_id:', JSON.stringify(logs, null, 2));
    }
}

inspectSessionData();
