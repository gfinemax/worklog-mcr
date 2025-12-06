import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase Admin Client (Service Role)
// We need service role to bypass RLS and insert worklogs as 'System'
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

import { shiftService } from '@/lib/shift-rotation'

// ... (keep imports)

export async function GET(request: Request) {
    try {
        // 1. Determine Current Time (KST)
        const now = new Date()
        const kstOffset = 9 * 60 * 60 * 1000
        const kstDate = new Date(now.getTime() + kstOffset)

        const hours = kstDate.getUTCHours() // Use UTC methods on the shifted date if server is UTC? 
        // Actually, if we shifted the time, we should use getUTCHours to get the "shifted" hour if we treat it as UTC.
        // But the original code used getUTCHours.
        // Let's stick to the original KST logic for the Auto-Close part, 
        // but for Auto-Create, we will use shiftService.

        const minutes = kstDate.getUTCMinutes()

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
                .neq('status', '근무종료') // Don't touch if already closed by Director

            if (staleDayLogs && staleDayLogs.length > 0) {
                for (const log of staleDayLogs) {
                    // Check if Operation is pre-signed
                    const isPreSigned = log.signatures?.operation && log.signatures.operation.length > 0

                    let newSignatures = log.signatures || {}
                    if (!isPreSigned) {
                        newSignatures = {
                            ...newSignatures,
                            operation: 'System Auto-Close',
                            leader: 'System Auto-Close'
                        }
                    }

                    const newIssues = [
                        ...(log.systemIssues || []),
                        {
                            id: crypto.randomUUID(), summary: isPreSigned
                                ? '근무 종료 시간(19:00) 경과로 인한 시스템 자동 마감 (사전 결재 완료)'
                                : '근무 종료 시간(19:00) 10분 초과로 인한 시스템 자동 종료'
                        }
                    ]

                    await supabaseAdmin
                        .from('worklogs')
                        .update({
                            status: '근무종료', // Use '근무종료' as final state for now, or '서명완료' if that's the convention
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
                .neq('status', '근무종료') // Don't touch if already closed by Director

            if (staleNightLogs && staleNightLogs.length > 0) {
                for (const log of staleNightLogs) {
                    // Check if Operation is pre-signed
                    const isPreSigned = log.signatures?.operation && log.signatures.operation.length > 0

                    let newSignatures = log.signatures || {}
                    if (!isPreSigned) {
                        newSignatures = {
                            ...newSignatures,
                            operation: 'System Auto-Close',
                            leader: 'System Auto-Close'
                        }
                    }

                    const newIssues = [
                        ...(log.systemIssues || []),
                        {
                            id: crypto.randomUUID(), summary: isPreSigned
                                ? '근무 종료 시간(08:00) 경과로 인한 시스템 자동 마감 (사전 결재 완료)'
                                : '근무 종료 시간(08:00) 10분 초과로 인한 시스템 자동 종료'
                        }
                    ]

                    await supabaseAdmin
                        .from('worklogs')
                        .update({
                            status: '근무종료', // Use '근무종료' as final state
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

        // 2. Get Active Shift Config
        const { data: configData, error: configError } = await supabaseAdmin
            .from('shift_pattern_configs')
            .select('*')
            .lte('valid_from', kstDate.toISOString()) // Use kstDate for query
            .or(`valid_to.is.null,valid_to.gte.${kstDate.toISOString()}`)
            .order('valid_from', { ascending: false })
            .limit(1)
            .single()

        if (configError || !configData) {
            console.error('Shift config not found, skipping auto-create')
            return NextResponse.json({
                message: 'Shift config not found, skipped auto-create',
                autoClose: autoCloseResult
            })
        }

        // 3. Calculate Expected Worklog Info using Shared Logic
        // We pass kstDate because shiftService expects a Date object where getHours() returns KST hour.
        // However, shiftService uses .getHours() (Local). 
        // If server is UTC, .getHours() on kstDate (which is shifted) might be tricky depending on how it was created.
        // kstDate = new Date(now.getTime() + 9h). 
        // If server is UTC, kstDate.getHours() will be (UTC+9). 
        // So passing kstDate is correct.

        const expectedInfo = shiftService.getExpectedWorklogInfo(kstDate, configData)

        if (!expectedInfo) {
            return NextResponse.json({
                message: 'Could not determine expected worklog info',
                autoClose: autoCloseResult
            })
        }

        const { date: targetDateStr, shift: targetShift, team: targetTeamName } = expectedInfo

        console.log(`[Auto-Create] Checking ${targetDateStr} ${targetShift} shift for team ${targetTeamName}`)

        // 3. Check if worklog exists
        // First, get the group_id for the target team
        const { data: groupData, error: groupError } = await supabaseAdmin
            .from('groups')
            .select('id')
            .eq('name', targetTeamName)
            .single()

        if (groupError || !groupData) {
            console.error(`[Auto-Create] Group not found for team ${targetTeamName}`)
            return NextResponse.json({ error: 'Group not found' }, { status: 500 })
        }

        const { data: existingLogs } = await supabaseAdmin
            .from('worklogs')
            .select('id')
            .eq('date', targetDateStr)
            .eq('type', targetShift === 'day' ? '주간' : '야간')
            .eq('group_id', groupData.id) // Check by group_id to match client behavior

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
                type: targetShift === 'day' ? '주간' : '야간',
                group_name: targetTeamName, // Use group_name instead of team
                group_id: groupData.id,
                status: '작성중',
                workers: { director: [], assistant: [], video: [] },
                is_auto_created: true,
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
