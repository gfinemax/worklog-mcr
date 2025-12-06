
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

import { shiftService, ShiftPatternConfig } from '../lib/shift-rotation'
import { addDays, format } from 'date-fns'

// Mock Config based on what we saw in DB
const mockConfig: ShiftPatternConfig = {
    id: 'test-id',
    valid_from: '2025-11-15', // From screenshot
    valid_to: null,
    cycle_length: 10,
    pattern_json: [
        {
            day: 0,
            A: { team: '4조', is_swap: false },
            N: { team: '3조', is_swap: false }
        },
        {
            day: 1,
            A: { team: '5조', is_swap: false },
            N: { team: '4조', is_swap: false }
        },
        {
            day: 2, // 3일차
            A: { team: '1조', is_swap: true }, // Swap!
            N: { team: '5조', is_swap: false }
        },
        // ... others
    ],
    roles_json: ['Director', 'Assistant', 'Video'],
    roster_json: {
        '1조': ['UserA', 'UserB', 'UserC'],
        '5조': ['UserX', 'UserY', 'UserZ']
    }
}

function verifySwap() {
    console.log('Verifying Swap Logic...')

    // Day 0 (2025-11-15) -> Index 0
    // Day 2 (2025-11-17) -> Index 2 (Swap Day)

    const targetDate = '2025-11-17'
    const teamName = '1조' // Should be Day Shift on Day 2

    const result = shiftService.calculateShift(targetDate, teamName, mockConfig)

    console.log(`Date: ${targetDate}`)
    console.log(`Team: ${teamName}`)
    console.log(`Shift Type: ${result.shiftType}`)
    console.log(`Is Swap: ${result.isSwap}`)
    console.log(`Roles Indices:`, result.roles)

    if (result.isSwap === true && result.roles.director === 1 && result.roles.assistant === 0) {
        console.log('SUCCESS: Swap logic is correctly calculated.')
    } else {
        console.error('FAILURE: Swap logic is incorrect.')
    }
}

verifySwap()
