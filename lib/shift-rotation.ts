import { supabase } from './supabase'
import { addDays, differenceInDays, parseISO, format } from 'date-fns'

export interface ShiftPatternConfig {
    id: string
    valid_from: string
    valid_to: string | null
    cycle_length: number
    pattern_json: DailyShiftPattern[]
    roles_json: string[]
}

export interface DailyShiftPattern {
    day: number
    A: { team: string; is_swap: boolean }
    N: { team: string; is_swap: boolean }
}

export interface ShiftInfo {
    date: string
    team: string
    shiftType: 'A' | 'N' | 'S' | 'Y'
    roles: {
        director: number // index in sorted member list
        assistant: number
        video: number
    }
    isSwap: boolean
}

export const shiftService = {
    // Fetch the active configuration for a specific date
    async getConfig(date?: Date | string): Promise<ShiftPatternConfig | null> {
        const d = date || new Date()
        const targetDate = typeof d === 'string' ? d : format(d, 'yyyy-MM-dd')

        const { data, error } = await supabase
            .from('shift_pattern_configs')
            .select('*')
            .lte('valid_from', targetDate)
            .or(`valid_to.is.null,valid_to.gte.${targetDate}`)
            .order('valid_from', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        if (error) {
            console.error('Error fetching shift config:', error)
            return null
        }

        return data
    },

    // Calculate shift info for a specific date and team
    calculateShift(date: Date | string, teamName: string, config: ShiftPatternConfig): ShiftInfo {
        const targetDate = typeof date === 'string' ? parseISO(date) : date
        const anchorDate = parseISO(config.valid_from)

        // Calculate days difference
        const diff = differenceInDays(targetDate, anchorDate)

        // Calculate index in cycle (handle negative diffs for past dates)
        let index = diff % config.cycle_length
        if (index < 0) index += config.cycle_length

        // Get pattern for this day index
        const dailyPattern = config.pattern_json.find(p => p.day === index)

        if (!dailyPattern) {
            // Fallback if pattern not found (should not happen if config is correct)
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
            // Check previous day for Sleep (S) logic if needed, or just assume Y/S based on pattern
            // For now, if not A or N, it's Off (Y) or Sleep (S). 
            // The user's pattern implies S follows N, but for simple role calculation, Y is fine.
            // If we need strict S/Y distinction, we'd need to check previous day's N.
            shiftType = 'Y'
        }

        // Define Roles Indices
        // Default: Director=0, Assistant=1, Video=2
        // Swap: Director=1, Assistant=0, Video=2
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
    },

    // Get shift info for a range of dates
    calculateShiftRange(startDate: Date, endDate: Date, teamName: string, config: ShiftPatternConfig): ShiftInfo[] {
        const results: ShiftInfo[] = []
        let current = startDate

        while (current <= endDate) {
            results.push(this.calculateShift(current, teamName, config))
            current = addDays(current, 1)
        }

        return results
    },

    // Calculate the expected next team based on current team and shift
    getNextTeam(currentTeam: string, currentShift: 'day' | 'night', config: ShiftPatternConfig): string | null {
        // 1. Find the day index in the cycle where the current team is working the current shift
        // Note: This assumes the current team is working correctly according to the pattern.
        // If the pattern has multiple days with the same team/shift (unlikely in this rotation), it picks the first one.
        // A more robust approach would be to pass the current date, but for now we follow the pattern logic.

        // However, since we might be in a state where the current date's pattern is what matters, 
        // let's try to find the pattern entry that matches.

        // Actually, we need to know "which day of the cycle" we are currently in to be precise.
        // But if we only have currentTeam and currentShift, we have to search the pattern.

        const currentPatternIndex = config.pattern_json.findIndex(p => {
            if (currentShift === 'day') return p.A.team === currentTeam
            return p.N.team === currentTeam
        })

        if (currentPatternIndex === -1) return null

        let nextTeam = ''

        if (currentShift === 'day') {
            // Next is Night of the SAME day index
            const pattern = config.pattern_json.find(p => p.day === currentPatternIndex)
            if (pattern) {
                nextTeam = pattern.N.team
            }
        } else {
            // Next is Day of the NEXT day index
            const nextDayIndex = (currentPatternIndex + 1) % config.cycle_length
            const pattern = config.pattern_json.find(p => p.day === nextDayIndex)
            if (pattern) {
                nextTeam = pattern.A.team
            }
        }

        return nextTeam || null
    }
}
