
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const { addDays, differenceInDays, parseISO, format, subDays } = require('date-fns');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkConfig() {
    const today = new Date().toISOString().split('T')[0];
    console.log(`Checking config for today: ${today}`);

    const { data: config, error } = await supabase
        .from('shift_pattern_configs')
        .select('*')
        .lte('valid_from', today)
        .or(`valid_to.is.null,valid_to.gte.${today}`)
        .order('valid_from', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        console.error('Error fetching config:', error);
        return;
    }

    if (!config) {
        console.log('No active config found.');
        return;
    }

    console.log('Active Config ID:', config.id);
    console.log('Roster JSON:', JSON.stringify(config.roster_json, null, 2));

    const teamName = '1조';

    // Simulate calculateShift logic inline to avoid import issues
    const targetDate = parseISO(today);
    const anchorDate = parseISO(config.valid_from);
    const diff = differenceInDays(targetDate, anchorDate);
    let index = diff % config.cycle_length;
    if (index < 0) index += config.cycle_length;

    const dailyPattern = config.pattern_json.find(p => p.day === index);

    let isSwap = false;
    let shiftType = 'Y';

    if (dailyPattern) {
        if (dailyPattern.A.team === teamName) {
            shiftType = 'A';
            isSwap = dailyPattern.A.is_swap;
        } else if (dailyPattern.N.team === teamName) {
            shiftType = 'N';
            isSwap = dailyPattern.N.is_swap;
        }
    }

    console.log(`Shift Info for ${teamName}: Type=${shiftType}, IsSwap=${isSwap}`);

    // getMembersWithRoles logic
    const roster = config.roster_json?.[teamName];
    if (!roster) {
        console.log('No Roster Found for team');
        return;
    }

    const members = [];
    if (isSwap) {
        members.push({ name: roster.감독, role: '부감독' });
        members.push({ name: roster.부감독, role: '감독' });
    } else {
        members.push({ name: roster.감독, role: '감독' });
        members.push({ name: roster.부감독, role: '부감독' });
    }
    members.push({ name: roster.영상, role: '영상' });

    console.log('Final Members:', JSON.stringify(members, null, 2));
}

checkConfig();
