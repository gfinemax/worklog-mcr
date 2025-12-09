import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Must use service role key for admin commands

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials (SERVICE_ROLE_KEY required)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function reloadSchemaCache() {
    console.log('Attempting to reload PostgREST schema cache...');

    // Using RPC if available, or direct raw query if we have a way.
    // Standard way is NOTIFY pgrst, 'reload config'
    // But supabase-js doesn't support raw queries easily unless via valid RPC or edge function.
    // However, if we assume we have a postgres connection string, we could use pg.
    // But we are in a limited environment.

    // Let's try the RPC 'reload_schema_cache' if it exists (some setups have it).
    // If not, we might fail.

    // ALTERNATIVE: Just creating/deleting a dummy table or column sometimes triggers it?
    // No, usually it listens for DDL changes.
    // But the error says it couldn't find the column, implies DDL was done but cache stale.
    // Actually, simply running ANY DDL might refresh it.

    // Let's try to run a raw SQL via an RPC call if the user has a 'exec_sql' function (common in these projects).

    const { data, error } = await supabase.rpc('exec_sql', {
        query: "NOTIFY pgrst, 'reload config'"
    });

    if (error) {
        console.error('RPC exec_sql failed:', error);
        console.log('Attempting alternative: notify via pg (requires pg module installed?)');
        // If we can't do it, we just tell user to restart.
    } else {
        console.log('Successfully sent NOTIFY pgrst, "reload config"');
    }
}

reloadSchemaCache();
