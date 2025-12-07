
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteLog() {
    const id = '8444b869-94a8-4e23-990b-de26276b52ba';
    console.log(`Deleting worklog ID: ${id}...`);

    const { error } = await supabase
        .from('worklogs')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting log:', error);
    } else {
        console.log('Successfully deleted worklog.');
    }
}

deleteLog();
