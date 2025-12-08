import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import { format, parseISO, differenceInDays } from 'date-fns';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function checkNov15Pattern() {
    const dateStr = '2025-11-15';

    // Get config for Nov 15
    const { data: configs } = await supabase
        .from('shift_pattern_configs')
        .select('*')
        .lte('valid_from', dateStr)
        .or(`valid_to.gte.${dateStr},valid_to.is.null`)
        .order('valid_from', { ascending: false })
        .limit(1);

    if (!configs || configs.length === 0) {
        console.log('No config found for', dateStr);
        return;
    }

    const config = configs[0];
    console.log('Config valid_from:', config.valid_from);
    console.log('Cycle length:', config.cycle_length);

    const targetDate = parseISO(dateStr);
    const anchorDate = parseISO(config.valid_from);
    const diff = differenceInDays(targetDate, anchorDate);
    let index = diff % config.cycle_length;
    if (index < 0) index += config.cycle_length;

    console.log('Days diff:', diff);
    console.log('Pattern index:', index);

    const pattern = config.pattern_json.find((p: any) => p.day === index);
    console.log('Pattern for day', index, ':', JSON.stringify(pattern, null, 2));

    if (pattern) {
        console.log('\n=== Nov 15 Shift Schedule ===');
        console.log('Day shift (A):', pattern.A?.team);
        console.log('Night shift (N):', pattern.N?.team);
    }
}

checkNov15Pattern();
