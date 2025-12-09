import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials (SERVICE_ROLE_KEY required)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addRosterJsonColumn() {
    console.log('Adding roster_json column to shift_pattern_configs...');

    // Using Supabase's SQL execution if possible via RPC
    // If not, we may need to run this via Supabase Dashboard SQL Editor

    const sql = `
        ALTER TABLE shift_pattern_configs
        ADD COLUMN IF NOT EXISTS roster_json JSONB DEFAULT NULL;
    `;

    // Check if there's an exec_sql or run_sql RPC function
    const { data, error } = await supabase.rpc('exec_sql', { query: sql });

    if (error) {
        console.error('RPC exec_sql failed:', error.message);
        console.log('\n=== MANUAL STEP REQUIRED ===');
        console.log('Please run the following SQL in your Supabase Dashboard SQL Editor:');
        console.log(sql);
        console.log('=============================\n');
        return;
    }

    console.log('Column added successfully!');

    // Reload schema cache
    console.log('Reloading schema cache...');
    await supabase.rpc('exec_sql', { query: "NOTIFY pgrst, 'reload config'" });
    console.log('Done!');
}

addRosterJsonColumn();
