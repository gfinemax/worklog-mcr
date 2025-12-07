
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { shiftService } from './lib/shift-rotation'

dotenv.config({ path: path.resolve(__dirname, '.env.local') })

// Mock supabase for the service if needed, but the service imports it directly. 
// Since we are running in same directory, it should work if we can load the module.
// However, tsx might have trouble resolving the relative import in 'lib/shift-rotation' if not handled well.
// Let's just create a standalone script that imports the service.

// Wait, the service imports 'supabase' from './supabase'.
// We need to ensure that resolves correctly or mock it.
// The simplest way is to replicate the logic or rely on the fact that I've inspected the config and code.
// But to be 100% sure, I'll try to run it.

// Helper to calculate without importing the whole service if import fails
async function manualCalculate() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const today = new Date()
    const config = await import('./lib/shift-rotation').then(m => m.shiftService.getConfig(today))

    if (config) {
        console.log('Valid From:', config.valid_from)
        const info = await import('./lib/shift-rotation').then(m => m.shiftService.calculateShift(today, '1조', config))
        console.log('Calculated Shift Info:', JSON.stringify(info, null, 2))

        // Manual verification of logic
        // Normal: Dir=0
        // Swap: Dir=1
        console.log('Expectation for Swap=True: Director Index should be 1')
    } else {
        console.log('No config found for today')
    }
}

manualCalculate()
