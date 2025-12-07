
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectLogs() {
    const date = '2025-12-07';
    console.log(`Inspecting worklogs for ${date}...`);

    const { data: logs, error } = await supabase
        .from('worklogs')
        .select('*')
        .eq('date', date)
        .eq('group_name', '1조');

    if (error) {
        console.error('Error fetching logs:', error);
        return;
    }

    if (!logs || logs.length === 0) {
        console.log('No logs found for 1조 on this date.');
    } else {
        console.log(`Found ${logs.length} logs:`);
        logs.forEach(log => {
            console.log(`[ID: ${log.id}] Type: ${log.type}, Status: ${log.status}`);
            console.log(`  Signatures:`, JSON.stringify(log.signatures));
            console.log(`  Created At: ${log.created_at}`);
        });
    }
}

inspectLogs();
