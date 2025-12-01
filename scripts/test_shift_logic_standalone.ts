
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { addDays, differenceInDays, parseISO, format } from 'date-fns'

dotenv.config({ path: '.env.local' })

// Mock Supabase client for testing logic without DB connection if needed, 
// but we are testing the logic function which is pure if we pass config.
// The issue with previous run might be import issues with 'lib/shift-rotation' which imports 'lib/supabase' which expects env vars.
// Let's define the logic locally in the test script to verify ALGORITHM first, avoiding module resolution issues.

interface ShiftConfig {
    id: string
    pattern_name: string
    cycle_length: number
    anchor_date: string
    shift_sequence: string[]
    role_rotation_map: {
        director: number
        assistant: number
        video: number
    }[]
    team_offsets: { [key: string]: number }
}

interface ShiftInfo {
    date: string
    team: string
    shiftType: 'A' | 'N' | 'S' | 'Y'
    roles: {
        director: number
        assistant: number
        video: number
    }
}

function calculateShift(date: Date | string, teamName: string, config: ShiftConfig): ShiftInfo {
    const targetDate = typeof date === 'string' ? parseISO(date) : date
    const anchorDate = parseISO(config.anchor_date)

    const diff = differenceInDays(targetDate, anchorDate)
    const offset = config.team_offsets[teamName] ?? 0

    let index = (diff + offset) % config.cycle_length
    if (index < 0) index += config.cycle_length

    const shiftType = config.shift_sequence[index] as 'A' | 'N' | 'S' | 'Y'
    const roles = config.role_rotation_map[index]

    return {
        date: format(targetDate, 'yyyy-MM-dd'),
        team: teamName,
        shiftType,
        roles
    }
}

// Mock Config
const mockConfig: ShiftConfig = {
    id: 'test-id',
    pattern_name: '5조 10교대 (ANSYY x 2)',
    cycle_length: 10,
    anchor_date: '2025-11-06',
    shift_sequence: ['A', 'N', 'S', 'Y', 'Y', 'A', 'N', 'S', 'Y', 'Y'],
    role_rotation_map: [
        { director: 0, assistant: 1, video: 2 },
        { director: 0, assistant: 1, video: 2 },
        { director: 0, assistant: 1, video: 2 },
        { director: 0, assistant: 1, video: 2 },
        { director: 0, assistant: 1, video: 2 },
        { director: 1, assistant: 0, video: 2 },
        { director: 1, assistant: 0, video: 2 },
        { director: 1, assistant: 0, video: 2 },
        { director: 1, assistant: 0, video: 2 },
        { director: 1, assistant: 0, video: 2 }
    ],
    team_offsets: {
        "1조": 0,
        "2조": 1,
        "3조": 2,
        "4조": 3,
        "5조": 4
    }
}

console.log('--- Running Shift Logic Tests ---')

const t1 = calculateShift('2025-11-06', '1조', mockConfig)
console.log('Test 1 (Anchor):', t1.shiftType === 'A' && t1.roles.director === 0 ? 'PASS' : 'FAIL', t1)

const t2 = calculateShift('2025-11-11', '1조', mockConfig)
console.log('Test 2 (Swap):', t2.shiftType === 'A' && t2.roles.director === 1 ? 'PASS' : 'FAIL', t2)

const t3 = calculateShift('2025-11-06', '2조', mockConfig)
console.log('Test 3 (Team 2):', t3.shiftType === 'N' ? 'PASS' : 'FAIL', t3)
