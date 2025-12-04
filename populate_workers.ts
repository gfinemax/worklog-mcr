
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Load env
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8')
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=')
        if (key && value) {
            process.env[key.trim()] = value.trim()
        }
    })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl!, supabaseKey!)

const roster: Record<string, { director: string[], assistant: string[], video: string[] }> = {
    '1조': { director: ['김준일'], assistant: ['박상필'], video: ['김소연'] },
    '2조': { director: ['황동성'], assistant: ['이석훈'], video: ['강한강'] },
    '3조': { director: ['남궁장'], assistant: ['이종원'], video: ['윤주현'] },
    '4조': { director: ['권영춘'], assistant: ['김희성'], video: ['심창규'] },
    '5조': { director: ['정광훈'], assistant: ['오동섭'], video: ['김단언'] }
}

async function populateWorkers() {
    console.log('Starting worker population...')

    // Fetch all worklogs
    const { data: worklogs, error } = await supabase
        .from('worklogs')
        .select('id, group_name, workers')

    if (error) {
        console.error('Error fetching worklogs:', error)
        return
    }

    console.log(`Found ${worklogs.length} worklogs. Updating...`)

    for (const log of worklogs) {
        const teamWorkers = roster[log.group_name]

        if (teamWorkers) {
            // Check if update is needed (optional, but good for logging)
            // We'll just update to ensure consistency

            const { error: updateError } = await supabase
                .from('worklogs')
                .update({ workers: teamWorkers })
                .eq('id', log.id)

            if (updateError) {
                console.error(`Failed to update log ${log.id} (${log.group_name}):`, updateError)
            } else {
                // console.log(`Updated log ${log.id} (${log.group_name})`)
            }
        } else {
            console.warn(`No roster found for group: ${log.group_name} (Log ID: ${log.id})`)
        }
    }

    console.log('Worker population complete.')
}

populateWorkers()
