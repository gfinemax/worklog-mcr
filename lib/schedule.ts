
export type ShiftType = '주간' | '야간' | '휴무'

export function predictShift(teamName: string, dateStr: string = new Date().toISOString().split('T')[0]): ShiftType {
    // Base Date: 2025-11-06 (Team 1 starts 'A')
    const baseDate = new Date('2025-11-06')
    const targetDate = new Date(dateStr)

    // Calculate days difference
    const diffTime = targetDate.getTime() - baseDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    // Extract team number from string (e.g., "1조" -> 1)
    const teamMatch = teamName.match(/(\d+)조/)
    if (!teamMatch) return '주간' // Default if not a numbered team

    const teamNum = parseInt(teamMatch[1], 10)

    // Pattern: ['A', 'N', 'S', 'Y', 'Y']
    // A=Day, N=Night, S=Sleep, Y=Off
    // Team 1 starts at index 0 on base date.
    // Team 2 starts at index ? 
    // If 10 teams cycle through 5 days, multiple teams must share patterns or be offset.
    // Usually:
    // Day 1: T1(A), T2(N), T3(S), T4(Y), T5(Y), T6(A)...
    // So Team N's offset is (TeamNum - 1).
    // Let's verify:
    // T1 (Offset 0): Index 0 -> A
    // T2 (Offset 1): Index 1 -> N
    // T3 (Offset 2): Index 2 -> S
    // T4 (Offset 3): Index 3 -> Y
    // T5 (Offset 4): Index 4 -> Y
    // T6 (Offset 5->0): Index 0 -> A

    // Formula: (daysSinceBase + (TeamNum - 1)) % 5
    // Note: Python's % handles negatives differently than JS, but here diffDays should be positive for dates after base.
    // If date is before base, we need to handle negative modulo carefully.

    let patternIndex = (diffDays + (teamNum - 1)) % 5

    // Handle negative modulo in JS
    if (patternIndex < 0) patternIndex = (patternIndex + 5) % 5

    const pattern = ['A', 'N', 'S', 'Y', 'Y']
    const shiftCode = pattern[patternIndex]

    switch (shiftCode) {
        case 'A': return '주간'
        case 'N': return '야간'
        default: return '휴무'
    }
}
