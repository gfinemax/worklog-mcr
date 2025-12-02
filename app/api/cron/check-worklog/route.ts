import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase Admin Client (Service Role)
// We need service role to bypass RLS and insert worklogs as 'System'
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
    try {
        // 1. Determine Current Time and Shift
        const now = new Date()
        // Convert to KST (UTC+9) for accurate day/shift calculation
        const kstOffset = 9 * 60 * 60 * 1000
        const kstDate = new Date(now.getTime() + kstOffset)

        const hours = kstDate.getUTCHours()
        const minutes = kstDate.getUTCMinutes()
        const timeInMinutes = hours * 60 + minutes

        // ==========================================
        // AUTO-CLOSE LOGIC (10 mins after shift end)
        // ==========================================
        let autoCloseResult = { count: 0, logs: [] as string[] }

        // Day Shift Deadline: 19:10 (Day shift ends 19:00)
        if (hours >= 19 && minutes >= 10) {
            const todayStr = kstDate.toISOString().split('T')[0]

            // Find stale Day logs (Today, '주간', Not Signed)
            const { data: staleDayLogs } = await supabaseAdmin
                .from('worklogs')
                .select('id, signatures, systemIssues')
                .eq('date', todayStr)
                .eq('type', '주간')
                .neq('status', '서명완료')

            if (staleDayLogs && staleDayLogs.length > 0) {
                for (const log of staleDayLogs) {
                    const newSignatures = {
                        ...(log.signatures || {}),
                        operation: 'System Auto-Close',
                        leader: 'System Auto-Close'
                    }
                    const newIssues = [
                        ...(log.systemIssues || []),
                        { id: crypto.randomUUID(), summary: '근무 종료 시간(19:00) 10분 초과로 인한 시스템 자동 종료' }
                    ]

                    await supabaseAdmin
                        .from('worklogs')
                        .update({
                            status: '서명완료',
                            signatures: newSignatures,
                            systemIssues: newIssues,
                            signature: '4/4' // Legacy support
                        })
                        .eq('id', log.id)

                    autoCloseResult.count++
                    autoCloseResult.logs.push(log.id)
                }
            }
        }

        // Night Shift Deadline: 08:10 (Night shift ends 08:00)
        if (hours >= 8 && minutes >= 10 && hours < 12) { // Check morning hours
            // Night shift belongs to YESTERDAY
            const yesterday = new Date(kstDate)
            yesterday.setDate(yesterday.getDate() - 1)
            const yesterdayStr = yesterday.toISOString().split('T')[0]

            // Find stale Night logs (Yesterday, '야간', Not Signed)
            const { data: staleNightLogs } = await supabaseAdmin
                .from('worklogs')
                .select('id, signatures, systemIssues')
                .eq('date', yesterdayStr)
                .eq('type', '야간')
                .neq('status', '서명완료')

            if (staleNightLogs && staleNightLogs.length > 0) {
                for (const log of staleNightLogs) {
                    const newSignatures = {
                        ...(log.signatures || {}),
                        operation: 'System Auto-Close',
                        leader: 'System Auto-Close'
                    }
                    const newIssues = [
                        ...(log.systemIssues || []),
                        { id: crypto.randomUUID(), summary: '근무 종료 시간(08:00) 10분 초과로 인한 시스템 자동 종료' }
                    ]

                    await supabaseAdmin
                        .from('worklogs')
                        .update({
                            status: '서명완료',
                            signatures: newSignatures,
                            systemIssues: newIssues,
                            signature: '4/4' // Legacy support
                        })
                        .eq('id', log.id)

                    autoCloseResult.count++
                    autoCloseResult.logs.push(log.id)
                }
            }
        }

        console.log(`[Auto-Close] Closed ${autoCloseResult.count} stale sessions.`)


        // ==========================================
        // AUTO-CREATE LOGIC
        // ==========================================

        // Shift Boundaries (Same as frontend logic)
        const dayStart = 7 * 60 + 30 // 07:30
        const dayEnd = 18 * 60 + 30 // 18:30

        // Determine Shift Type
        // Note: This cron should run shortly after the shift start time (e.g., 07:40, 18:40)
        let targetShift: 'day' | 'night'
        let targetDateStr = kstDate.toISOString().split('T')[0]

        if (timeInMinutes >= dayStart && timeInMinutes < dayEnd) {
            targetShift = 'day'
        } else {
            targetShift = 'night'
            // If it's past midnight but before day start (e.g. 01:00), it belongs to previous day's night shift
            // But for auto-creation, we usually run this check right after shift start.
            // If running at 18:40, it's today's night shift.
            // If running at 07:40, it's today's day shift.
        }

        // 2. Get Active Shift Config to determine which team SHOULD be working
        // Since we don't have the full shift rotation logic here easily without importing large libs,
        // we might need to rely on checking if ANY worklog exists, or iterate through all teams.
        // BETTER APPROACH: Check for ALL teams. If a team is supposed to be working, they should have a log.
        // BUT, usually only one team works per shift.

        // For now, let's simplify: We want to ensure the "Active Team" has a log.
        // We can fetch the shift pattern config from DB if stored, or calculate it.
        // Let's assume we iterate through all known groups and check if they have a log? 
        // No, that would create logs for off-duty teams.

        // We need `shiftService.getNextTeam` logic here. 
        // Since this is an Edge/Server route, we can import `shiftService` if it doesn't use client-only hooks.
        // Let's try to import it. If `lib/shift-rotation` is pure TS, it should work.

        // However, `shiftService` might need `supabase` client.
        // Let's fetch the config manually to be safe and lightweight.

        const { data: configData, error: configError } = await supabaseAdmin
            .from('shift_pattern_configs') // Corrected table name
            .select('*')
            .lte('valid_from', targetDateStr)
            .or(`valid_to.is.null,valid_to.gte.${targetDateStr}`)
            .order('valid_from', { ascending: false })
            .limit(1)
            .single()

        if (configError || !configData) {
            // If config missing, we can't determine team, so skip auto-create
            console.error('Shift config not found, skipping auto-create')
            return NextResponse.json({
                message: 'Shift config not found, skipped auto-create',
                autoClose: autoCloseResult
            })
        }

        // Calculate Active Team
        // Logic adapted from `shift-rotation.ts`
        const pattern = configData.pattern_json // Corrected column name
        const baseDate = new Date(configData.valid_from) // Corrected column name

        // Calculate days diff
        const targetDateObj = new Date(targetDateStr)
        // Reset hours for accurate diff
        targetDateObj.setHours(0, 0, 0, 0)
        baseDate.setHours(0, 0, 0, 0)

        const diffTime = targetDateObj.getTime() - baseDate.getTime()
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

        let index = diffDays % configData.cycle_length
        if (index < 0) index += configData.cycle_length

        const dailyPattern = pattern.find((p: any) => p.day === index)

        if (!dailyPattern) {
            return NextResponse.json({
                message: 'Pattern not found for index, skipped auto-create',
                autoClose: autoCloseResult
            })
        }

        const targetTeamName = targetShift === 'day' ? dailyPattern.A.team : dailyPattern.N.team

        console.log(`[Auto-Create] Checking ${targetDateStr} ${targetShift} shift for team ${targetTeamName}`)

        // 3. Check if worklog exists
        const { data: existingLogs } = await supabaseAdmin
            .from('worklogs')
            .select('id')
            .eq('date', targetDateStr)
            .eq('type', targetShift === 'day' ? '주간' : '야간') // Corrected column and value
            .eq('team', targetTeamName) // Corrected column name

        if (existingLogs && existingLogs.length > 0) {
            return NextResponse.json({
                message: 'Worklog already exists',
                id: existingLogs[0].id,
                autoClose: autoCloseResult
            })
        }

        // 4. Create Worklog if missing
        const { data: newLog, error: createError } = await supabaseAdmin
            .from('worklogs')
            .insert({
                date: targetDateStr,
                type: targetShift === 'day' ? '주간' : '야간', // Corrected column and value
                team: targetTeamName, // Corrected column name
                status: '작성중', // Corrected status (pending -> 작성중)
                workers: { director: [], assistant: [], video: [] }, // Initialize JSONB
                is_auto_created: true,
                // writer_name is not in schema? It's usually inferred from session or user.
                // But we can't set it here easily if column doesn't exist.
                // Let's check schema. 'writer_name' does not exist in 01_create_tables.sql.
                // So we omit it.
            })
            .select()
            .single()

        if (createError) {
            console.error('[Auto-Create] Failed to create worklog:', createError)
            return NextResponse.json({ error: createError.message }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: 'Auto-created worklog',
            worklog: newLog,
            autoClose: autoCloseResult
        })

    } catch (error: any) {
        console.error('[Auto-Create] Internal Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
