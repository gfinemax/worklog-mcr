
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

async function analyze() {
    // Fetch all worklogs
    const { data: worklogs, error } = await supabase
        .from('worklogs')
        .select('id, date, type, group_name, created_at')
        .order('date', { ascending: false })

    if (error) {
        console.error('Error fetching worklogs:', error)
        return
    }

    // Fetch all posts to count links
    const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('id, worklog_id')

    if (postsError) {
        console.error('Error fetching posts:', postsError)
        return
    }

    const postCounts: Record<string, number> = {}
    posts?.forEach(p => {
        if (p.worklog_id) {
            postCounts[p.worklog_id] = (postCounts[p.worklog_id] || 0) + 1
        }
    })

    // Group by Date
    const grouped: Record<string, any[]> = {}
    worklogs?.forEach(log => {
        if (!grouped[log.date]) grouped[log.date] = []
        grouped[log.date].push(log)
    })

    console.log('--- Analysis Report ---')
    let missingCount = 0
    let duplicateCount = 0

    const sortedDates = Object.keys(grouped).sort().reverse()

    for (const date of sortedDates) {
        const logs = grouped[date]
        const dayLogs = logs.filter(l => l.type === '주간')
        const nightLogs = logs.filter(l => l.type === '야간')

        const issues: string[] = []

        // Check Duplicates
        if (dayLogs.length > 1) {
            issues.push(`Duplicate DAY logs: ${dayLogs.length}`)
            duplicateCount++
        }
        if (nightLogs.length > 1) {
            issues.push(`Duplicate NIGHT logs: ${nightLogs.length}`)
            duplicateCount++
        }

        // Check Missing
        if (dayLogs.length === 0) {
            issues.push('Missing DAY log')
            missingCount++
        }
        if (nightLogs.length === 0) {
            issues.push('Missing NIGHT log')
            missingCount++
        }

        if (issues.length > 0) {
            console.log(`\nDate: ${date}`)
            issues.forEach(i => console.log(`- ${i}`))

            if (dayLogs.length > 1) {
                console.log('  Day Logs:')
                dayLogs.forEach(l => console.log(`    ID: ${l.id}, Group: ${l.group_name}, Posts: ${postCounts[l.id] || 0}, Created: ${l.created_at}`))
            }
            if (nightLogs.length > 1) {
                console.log('  Night Logs:')
                nightLogs.forEach(l => console.log(`    ID: ${l.id}, Group: ${l.group_name}, Posts: ${postCounts[l.id] || 0}, Created: ${l.created_at}`))
            }
        }
    }

    console.log('\n--- Summary ---')
    console.log(`Total Dates Checked: ${sortedDates.length}`)
    console.log(`Dates with Issues: ${Object.keys(grouped).filter(d => {
        const l = grouped[d]
        const day = l.filter(x => x.type === '주간').length
        const night = l.filter(x => x.type === '야간').length
        return day !== 1 || night !== 1
    }).length}`)
}

analyze()
