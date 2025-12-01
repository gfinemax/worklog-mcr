
import { shiftService, ShiftConfig } from '../lib/shift-rotation'
import { parseISO } from 'date-fns'

// Mock Config matching the DB seed
const mockConfig: ShiftConfig = {
    id: 'test-id',
    pattern_name: '5조 10교대 (ANSYY x 2)',
    cycle_length: 10,
    anchor_date: '2025-11-06',
    shift_sequence: ['A', 'N', 'S', 'Y', 'Y', 'A', 'N', 'S', 'Y', 'Y'],
    role_rotation_map: [
        { director: 0, assistant: 1, video: 2 }, // Day 0
        { director: 0, assistant: 1, video: 2 },
        { director: 0, assistant: 1, video: 2 },
        { director: 0, assistant: 1, video: 2 },
        { director: 0, assistant: 1, video: 2 }, // Day 4
        { director: 1, assistant: 0, video: 2 }, // Day 5 (Swap)
        { director: 1, assistant: 0, video: 2 },
        { director: 1, assistant: 0, video: 2 },
        { director: 1, assistant: 0, video: 2 },
        { director: 1, assistant: 0, video: 2 }  // Day 9
    ],
    team_offsets: {
        "1조": 0,
        "2조": 1, // Not accurate to real ANSYY stagger but using seed values
        "3조": 2,
        "4조": 3,
        "5조": 4
    }
}

// Test Case 1: Anchor Date (2025-11-06) for Team 1
// Expect: Index 0 -> Shift 'A', Roles { dir: 0, asst: 1 }
const t1 = shiftService.calculateShift('2025-11-06', '1조', mockConfig)
console.log('Test 1 (Anchor):', t1.shiftType === 'A' && t1.roles.director === 0 ? 'PASS' : 'FAIL', t1)

// Test Case 2: 5 Days Later (2025-11-11) for Team 1
// Expect: Index 5 -> Shift 'A', Roles { dir: 1, asst: 0 } (Swapped)
const t2 = shiftService.calculateShift('2025-11-11', '1조', mockConfig)
console.log('Test 2 (Swap):', t2.shiftType === 'A' && t2.roles.director === 1 ? 'PASS' : 'FAIL', t2)

// Test Case 3: Team 2 on Anchor Date
// Offset 1 -> Index 1 -> Shift 'N'
const t3 = shiftService.calculateShift('2025-11-06', '2조', mockConfig)
console.log('Test 3 (Team 2):', t3.shiftType === 'N' ? 'PASS' : 'FAIL', t3)
