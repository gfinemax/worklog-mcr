import { supabase } from '../lib/supabase';

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

    // Also check pattern to see is_swap for today
    const { shiftService } = await import('../lib/shift-rotation');

    // Mock calculate
    // We need to know which team to check. Let's check '1조' as in the screenshot.
    const teamName = '1조';

    // Manually calculate shift to debug
    // We can't import shiftService properly if it depends on frontend stuff? 
    // Usually lib/shift-rotation.ts is pure TS.

    const shiftInfo = shiftService.calculateShift(today, teamName, config);
    console.log(`Shift Info for ${teamName} on ${today}:`);
    console.log('Shift Type:', shiftInfo.shiftType);
    console.log('Is Swap:', shiftInfo.isSwap);
    console.log('Roles Indices:', shiftInfo.roles);

    // Run getMembersWithRoles
    const members = shiftService.getMembersWithRoles(teamName, today, config);
    console.log('Calculated Members with Roles:', JSON.stringify(members, null, 2));
}

checkConfig();
