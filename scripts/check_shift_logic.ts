
import dotenv from 'dotenv'
import path from 'path'
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

// Mock localStorage for Supabase client
global.localStorage = {
    getItem: () => null,
    setItem: () => { },
    removeItem: () => { },
    clear: () => { },
    key: () => null,
    length: 0
} as any

import { shiftService } from '../lib/shift-rotation'

async function checkShift() {
    const dateStr = '2025-12-05'
    const date = new Date(dateStr)

    console.log(`Checking shift for ${dateStr}`)

    const config = await shiftService.getConfig(date)
    if (!config) {
        console.log('No config found')
        return
    }

    const teams = shiftService.getTeamsForDate(date, config)
    console.log('Teams:', teams)

    const now = new Date('2025-12-05T22:00:00')
    const logical = shiftService.getLogicalShiftInfo(now)
    console.log('Logical Shift Info (22:00):', logical)

    const teamsForLogicalDate = shiftService.getTeamsForDate(logical.date, config)
    console.log('Teams for Logical Date:', teamsForLogicalDate)
}

checkShift()
