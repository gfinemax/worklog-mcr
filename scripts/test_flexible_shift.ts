
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

import { shiftService, ShiftPatternConfig } from '../lib/shift-rotation'
import { format, addDays, parseISO } from 'date-fns'

// Mock Config for Testing (Matches the SQL Insert)
const mockConfig: ShiftPatternConfig = {
    id: 'test-config',
    valid_from: '2025-11-06',
    valid_to: null,
    cycle_length: 10,
    roles_json: ["감독", "부감독", "영상"],
    pattern_json: [
        { day: 0, A: { team: "1조", is_swap: false }, N: { team: "4조", is_swap: true } },
        { day: 1, A: { team: "3조", is_swap: true }, N: { team: "1조", is_swap: false } },
        { day: 2, A: { team: "5조", is_swap: false }, N: { team: "3조", is_swap: true } },
        { day: 3, A: { team: "2조", is_swap: true }, N: { team: "5조", is_swap: false } },
        { day: 4, A: { team: "4조", is_swap: false }, N: { team: "2조", is_swap: true } },
        { day: 5, A: { team: "1조", is_swap: true }, N: { team: "4조", is_swap: false } },
        { day: 6, A: { team: "3조", is_swap: false }, N: { team: "1조", is_swap: true } },
        { day: 7, A: { team: "5조", is_swap: true }, N: { team: "3조", is_swap: false } },
        { day: 8, A: { team: "2조", is_swap: false }, N: { team: "5조", is_swap: true } },
        { day: 9, A: { team: "4조", is_swap: true }, N: { team: "2조", is_swap: false } }
    ]
}

async function testShiftRotation() {
    console.log("Testing 10-Day Shift Rotation (2025-11-06 Start)\n")

    const startDate = parseISO('2025-11-06')
    const teams = ['1조', '2조', '3조', '4조', '5조']

    // Test Day 1 to Day 10
    for (let i = 0; i < 10; i++) {
        const currentDate = addDays(startDate, i)
        const dateStr = format(currentDate, 'yyyy-MM-dd')
        console.log(`[Day ${i + 1}] ${dateStr}`)

        for (const team of teams) {
            const shift = shiftService.calculateShift(currentDate, team, mockConfig)
            if (shift.shiftType !== 'Y') {
                const roleStatus = shift.isSwap ? "SWAP (Director<->Assistant)" : "NORMAL"
                console.log(`  ${team}: ${shift.shiftType} - ${roleStatus}`)
            }
        }
        console.log('')
    }
}

testShiftRotation()
