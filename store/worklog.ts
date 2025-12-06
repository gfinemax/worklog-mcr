
import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export interface ChannelLog {
    content?: string // Deprecated, kept for backward compatibility if needed
    posts: { id: string; summary: string }[]
    timecodes: { [key: number]: string }
}

export interface Worklog {
    id: string | number
    date: string
    groupName: string // "1조", "2조", etc. (Renamed from team)
    type: '주간' | '야간'
    workers: {
        director: string[]
        assistant: string[]
        video: string[]
    }
    status: '작성중' | '근무종료' | '서명완료' | '일지확정' | '결재완료'
    signature: string
    signatures?: {
        operation: string | null
        mcr: string | null
        team_leader: string | null
        network: string | null
    }
    isImportant: boolean
    isAutoCreated?: boolean
    aiSummary?: string
    channelLogs?: { [key: string]: ChannelLog }
    systemIssues?: { id: string; summary: string }[]
    maxPriority?: '긴급' | '중요' | '일반' | null
}

interface WorklogStore {
    worklogs: Worklog[]
    fetchWorklogs: () => Promise<void>
    addWorklog: (worklog: Omit<Worklog, 'id'>) => Promise<Worklog | { error: any } | null>
    updateWorklog: (id: string | number, updates: Partial<Worklog>) => Promise<{ error: any }>
    fetchWorklogPosts: (worklogId: string) => Promise<{ id: string; summary: string; channel?: string }[]>
    fetchWorklogById: (id: string) => Promise<Worklog | null>
}

export const useWorklogStore = create<WorklogStore>((set, get) => ({
    worklogs: [],
    fetchWorklogs: async () => {
        const { data, error } = await supabase
            .from('worklogs')
            .select(`
                *,
                group:groups(name),
                posts(priority)
            `)
            .order('date', { ascending: false })
            .order('type', { ascending: true }) // '야간' < '주간', so Night comes first (Latest)

        if (error) {
            console.error('Error fetching worklogs:', error)
            return
        }

        const formattedWorklogs: Worklog[] = data.map((log: any) => {
            // Calculate max priority
            let maxPriority: '긴급' | '중요' | '일반' | null = null
            if (log.posts && log.posts.length > 0) {
                const priorities = log.posts.map((p: any) => p.priority)
                if (priorities.includes('긴급')) maxPriority = '긴급'
                else if (priorities.includes('중요')) maxPriority = '중요'
                else if (priorities.includes('일반')) maxPriority = '일반'
            }

            return {
                id: log.id,
                date: log.date,
                groupName: log.group_name || log.group?.name || 'Unknown', // Map group_name column
                type: log.type,
                workers: log.workers || { director: [], assistant: [], video: [] },
                status: log.status,
                signature: log.signature || "0/4",
                signatures: log.signatures || { operation: null, mcr: null, team_leader: null, network: null },
                isImportant: false,
                isAutoCreated: log.is_auto_created || false,
                aiSummary: log.ai_summary,
                channelLogs: log.channel_logs || {},
                systemIssues: log.system_issues || [],
                maxPriority
            }
        })

        set({ worklogs: formattedWorklogs })
    },
    addWorklog: async (worklog) => {
        // 1. Get group_id
        const { data: groupData, error: groupError } = await supabase
            .from('groups')
            .select('id')
            .eq('name', worklog.groupName)
            .single()

        if (groupError || !groupData) {
            console.error('Error finding group:', groupError)
            return null
        }

        // 2. Insert or Update worklog (Upsert)
        const payload = {
            date: worklog.date,
            type: worklog.type,
            status: worklog.status,
            channel_logs: worklog.channelLogs,
            workers: worklog.workers,
            // system_issues: worklog.systemIssues, // Column missing in DB, disabling for now
            group_id: groupData.id,
            group_name: worklog.groupName, // Renamed column
            signatures: worklog.signatures,
            is_auto_created: worklog.isAutoCreated
        }

        // Check if worklog exists
        const { data: existingLog, error: fetchError } = await supabase
            .from('worklogs')
            .select('id')
            .eq('group_id', groupData.id)
            .eq('date', worklog.date)
            .eq('type', worklog.type)
            .maybeSingle()

        if (fetchError) {
            console.error('Error checking existing worklog:', fetchError)
            return null
        }

        let data, error

        if (existingLog) {
            // Update
            const { data: updatedData, error: updateError } = await supabase
                .from('worklogs')
                .update(payload)
                .eq('id', existingLog.id)
                .select()

            data = updatedData
            error = updateError
        } else {
            // Insert
            const { data: insertedData, error: insertError } = await supabase
                .from('worklogs')
                .insert(payload)
                .select()

            data = insertedData
            error = insertError
        }

        if (error) {
            // Check for unique constraint violation
            if (error.code === '23505') { // unique_violation
                console.log('Worklog already exists, fetching existing one...')
                const { data: existing, error: fetchError } = await supabase
                    .from('worklogs')
                    .select('*')
                    .eq('group_id', groupData.id)
                    .eq('date', worklog.date)
                    .eq('type', worklog.type)
                    .single()

                if (!fetchError && existing) {
                    return {
                        id: existing.id,
                        date: existing.date,
                        groupName: worklog.groupName,
                        type: existing.type,
                        workers: existing.workers || { director: [], assistant: [], video: [] },
                        status: existing.status,
                        signature: existing.signature || "0/4",
                        signatures: existing.signatures || { operation: null, mcr: null, team_leader: null, network: null },
                        isImportant: false,
                        isAutoCreated: existing.is_auto_created || false,
                        channelLogs: existing.channel_logs || {},
                        systemIssues: existing.system_issues || []
                    } as Worklog
                }
            }

            console.error('Error adding/updating worklog:', JSON.stringify(error, null, 2))
            return { error }
        }
        if (!data || data.length === 0) {
            console.error('No data returned from insert/update')
            return null
        }
        const createdLog = data[0]

        get().fetchWorklogs()

        return {
            id: createdLog.id,
            date: createdLog.date,
            groupName: worklog.groupName,
            type: createdLog.type,
            workers: worklog.workers,
            status: createdLog.status,
            signature: createdLog.signature || "0/4",
            signatures: createdLog.signatures || { operation: null, mcr: null, team_leader: null, network: null },
            isImportant: false,
            isAutoCreated: createdLog.is_auto_created || false,
            channelLogs: createdLog.channel_logs || {},
            systemIssues: createdLog.system_issues || []
        } as Worklog
    },
    fetchWorklogById: async (id: string) => {
        const { data, error } = await supabase
            .from('worklogs')
            .select(`
                *,
                group:groups(name)
            `)
            .eq('id', id)
            .single()

        if (error) {
            console.error('Error fetching worklog by id:', error)
            return null
        }

        if (data) {
            const formattedLog: Worklog = {
                id: data.id,
                date: data.date,
                groupName: data.group_name || data.group?.name || 'Unknown',
                type: data.type,
                workers: data.workers || { director: [], assistant: [], video: [] },
                status: data.status,
                signature: data.signature || "0/4",
                signatures: data.signatures || { operation: null, mcr: null, team_leader: null, network: null },
                isImportant: false,
                isAutoCreated: data.is_auto_created || false,
                aiSummary: data.ai_summary,
                channelLogs: data.channel_logs || {},
                systemIssues: data.system_issues || []
            }

            set(state => {
                const index = state.worklogs.findIndex(w => String(w.id) === String(formattedLog.id))
                if (index !== -1) {
                    const newWorklogs = [...state.worklogs]
                    newWorklogs[index] = formattedLog
                    return { worklogs: newWorklogs }
                } else {
                    return { worklogs: [...state.worklogs, formattedLog] }
                }
            })

            return formattedLog
        }
        return null
    },

    updateWorklog: async (id, updates) => {
        // Optimistic update
        set(state => ({
            worklogs: state.worklogs.map(w =>
                String(w.id) === String(id) ? { ...w, ...updates } : w
            )
        }))

        const dbUpdates: any = {
            status: updates.status,
        }

        if (updates.channelLogs) dbUpdates.channel_logs = updates.channelLogs
        if (updates.type) dbUpdates.type = updates.type
        if (updates.workers) dbUpdates.workers = updates.workers
        if (updates.aiSummary) dbUpdates.ai_summary = updates.aiSummary
        if (updates.signatures) dbUpdates.signatures = updates.signatures
        if (updates.isAutoCreated !== undefined) dbUpdates.is_auto_created = updates.isAutoCreated
        // if (updates.systemIssues) dbUpdates.system_issues = updates.systemIssues // Column missing in DB

        const { error } = await supabase
            .from('worklogs')
            .update(dbUpdates)
            .eq('id', id)

        if (error) {
            console.error('Error updating worklog:', JSON.stringify(error, null, 2))
            return { error }
        }
        return { error: null }
    },

    fetchWorklogPosts: async (worklogId: string) => {
        const { data, error } = await supabase
            .from('posts')
            .select('id, summary, channel')
            .eq('worklog_id', worklogId)

        if (error) {
            console.error('Error fetching worklog posts:', error)
            return []
        }
        return data || []
    }

}))
