
import { addDays, differenceInDays, parseISO, format } from 'date-fns'
import fs from 'fs'

// --- Copied Logic from lib/shift-rotation.ts ---

interface ShiftPatternConfig {
    id: string
    valid_from: string
    valid_to: string | null
    cycle_length: number
    pattern_json: DailyShiftPattern[]
    roles_json: string[]
}

interface DailyShiftPattern {
    day: number
    A: { team: string; is_swap: boolean }
    N: { team: string; is_swap: boolean }
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
    isSwap: boolean
}

const shiftService = {
    calculateShift(date: Date | string, teamName: string, config: ShiftPatternConfig): ShiftInfo {
        const targetDate = typeof date === 'string' ? parseISO(date) : date
        const anchorDate = parseISO(config.valid_from)

        const diff = differenceInDays(targetDate, anchorDate)

        let index = diff % config.cycle_length
        if (index < 0) index += config.cycle_length

        const dailyPattern = config.pattern_json.find(p => p.day === index)

        if (!dailyPattern) {
            return {
                date: format(targetDate, 'yyyy-MM-dd'),
                team: teamName,
                shiftType: 'Y',
                roles: { director: 0, assistant: 1, video: 2 },
                isSwap: false
            }
        }

        let shiftType: 'A' | 'N' | 'S' | 'Y' = 'Y'
        let isSwap = false

        if (dailyPattern.A.team === teamName) {
            shiftType = 'A'
            isSwap = dailyPattern.A.is_swap
        } else if (dailyPattern.N.team === teamName) {
            shiftType = 'N'
            isSwap = dailyPattern.N.is_swap
        } else {
            shiftType = 'Y'
        }

        const roles = isSwap
            ? { director: 1, assistant: 0, video: 2 }
            : { director: 0, assistant: 1, video: 2 }

        return {
            date: format(targetDate, 'yyyy-MM-dd'),
            team: teamName,
            shiftType,
            roles,
            isSwap
        }
    }
}

// --- Test Data ---

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

// --- Run Test ---

async function testShiftRotation() {
    let output = "Testing 10-Day Shift Rotation (2025-11-06 Start)\n\n"

    const startDate = parseISO('2025-11-06')
    const teams = ['1조', '2조', '3조', '4조', '5조']

    for (let i = 0; i < 10; i++) {
        const currentDate = addDays(startDate, i)
        const dateStr = format(currentDate, 'yyyy-MM-dd')

        let dayTeam = ''
        let nightTeam = ''

        for (const team of teams) {
            const shift = shiftService.calculateShift(currentDate, team, mockConfig)
            if (shift.shiftType === 'A') dayTeam = `${team}(${shift.isSwap ? 'SWAP' : 'NORMAL'})`
            if (shift.shiftType === 'N') nightTeam = `${team}(${shift.isSwap ? 'SWAP' : 'NORMAL'})`
        }

        output += `[Day ${i + 1}] ${dateStr} | 주간: ${dayTeam} | 야간: ${nightTeam}\n`
    }

    fs.writeFileSync('verification_output.txt', output)
    console.log('Output written to verification_output.txt')
}

testShiftRotation()
