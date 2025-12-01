
import { predictShift } from '../lib/schedule'

const testCases = [
    { team: '1조', date: '2025-11-06', expected: '주간' }, // Base date
    { team: '1조', date: '2025-11-07', expected: '야간' },
    { team: '1조', date: '2025-11-08', expected: '휴무' }, // Sleep
    { team: '1조', date: '2025-11-09', expected: '휴무' }, // Off
    { team: '1조', date: '2025-11-10', expected: '휴무' }, // Off
    { team: '1조', date: '2025-11-11', expected: '주간' }, // Cycle repeats

    // Team 2 (Offset 1? Let's check logic)
    // If Team 1 is A on Day 0.
    // Team 2 should be N on Day 0? Or A on Day 4?
    // Let's assume standard rotation: T1->A, T2->N...
    // If T1 is A (Index 0), T2 is N (Index 1).
    // So T2 offset should be 1.
    // T2 on 2025-11-06: Index (0 + 1) % 5 = 1 -> N (Night).
    { team: '2조', date: '2025-11-06', expected: '야간' },
    { team: '3조', date: '2025-11-06', expected: '휴무' }, // S
]

console.log('Running Shift Prediction Tests...')
let passed = 0
let failed = 0

testCases.forEach(tc => {
    const result = predictShift(tc.team, tc.date)
    if (result === tc.expected) {
        console.log(`[PASS] ${tc.team} on ${tc.date}: Expected ${tc.expected}, Got ${result}`)
        passed++
    } else {
        console.error(`[FAIL] ${tc.team} on ${tc.date}: Expected ${tc.expected}, Got ${result}`)
        failed++
    }
})

console.log(`\nTotal: ${testCases.length}, Passed: ${passed}, Failed: ${failed}`)

if (failed > 0) {
    process.exit(1)
}
