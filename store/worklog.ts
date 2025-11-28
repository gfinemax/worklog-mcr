
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
    team: string // "1조", "2조", etc.
    type: '주간' | '야간'
    workers: {
        director: string[]
        assistant: string[]
        video: string[]
    }
    status: '작성중' | '근무종료' | '서명완료'
    signature: string
    isImportant: boolean
    aiSummary?: string
    channelLogs?: { [key: string]: ChannelLog }
    systemIssues?: { id: string; summary: string }[]
}

interface WorklogStore {
    worklogs: Worklog[]
    fetchWorklogs: () => Promise<void>
    addWorklog: (worklog: Omit<Worklog, 'id'>) => Promise<Worklog | null>
    updateWorklog: (id: string | number, updates: Partial<Worklog>) => Promise<void>
    fetchWorklogPosts: (worklogId: string) => Promise<{ id: string; summary: string; channel?: string }[]>
    fetchWorklogById: (id: string) => Promise<void>
}

export const useWorklogStore = create<WorklogStore>((set, get) => ({
    worklogs: [],
    fetchWorklogs: async () => {
        const { data, error } = await supabase
            .from('worklogs')
            .select(`
                *,
                group:groups(name),
                worklog_staff(
                    role,
                    user:users(name),
                    support_staff(name)
                )
            `)
            .order('work_date', { ascending: false })

        if (error) {
            console.error('Error fetching worklogs:', error)
            return
        }

        const formattedWorklogs: Worklog[] = data.map((log: any) => ({
            id: log.id,
            date: log.work_date,
            team: log.group?.name || 'Unknown',
            type: log.shift_type === 'A' ? '주간' : '야간',
            workers: {
                director: log.worklog_staff?.filter((s: any) => s.role === 'main_director').map((s: any) => s.user?.name || s.support_staff?.name) || [],
                assistant: log.worklog_staff?.filter((s: any) => s.role === 'sub_director').map((s: any) => s.user?.name || s.support_staff?.name) || [],
                video: log.worklog_staff?.filter((s: any) => s.role === 'tech_staff').map((s: any) => s.user?.name || s.support_staff?.name) || []
            },
            status: log.status,
            signature: "0/4",
            isImportant: false,
            aiSummary: log.ai_summary,
            channelLogs: log.channel_logs || {},
            systemIssues: log.system_issues || []
        }))

        set({ worklogs: formattedWorklogs })
    },
    addWorklog: async (worklog) => {
        // 1. Get group_id
        const { data: groupData, error: groupError } = await supabase
            .from('groups')
            .select('id')
            .eq('name', worklog.team)
            .single()

        if (groupError || !groupData) {
            console.error('Error finding group:', groupError)
            return null
        }

        // 2. Insert or Update worklog (Upsert)
        const payload = {
            work_date: worklog.date,
            shift_type: worklog.type === '주간' ? 'A' : 'N',
            status: worklog.status,
            channel_logs: worklog.channelLogs,
            // system_issues: worklog.systemIssues, // Column missing in DB, disabling for now
            group_id: groupData.id
        }

        const { data, error } = await supabase
            .from('worklogs')
            .upsert(payload, {
                onConflict: 'group_id, work_date, shift_type',
                ignoreDuplicates: false
            })
            .select()

        if (error) {
            console.error('Error adding/updating worklog:', error)
            return null
        }
        const createdLog = data[0]

        get().fetchWorklogs()

        return {
            id: createdLog.id,
            date: createdLog.work_date,
            team: worklog.team,
            type: createdLog.shift_type === 'A' ? '주간' : '야간',
            workers: worklog.workers,
            status: createdLog.status,
            signature: "0/4",
            isImportant: false,
            channelLogs: createdLog.channel_logs || {},
            systemIssues: createdLog.system_issues || []
        } as Worklog
    },
    fetchWorklogById: async (id: string) => {
        const { data, error } = await supabase
            .from('worklogs')
            .select(`
                *,
                group:groups(name),
                worklog_staff(
                    role,
                    user:users(name),
                    support_staff(name)
                )
            `)
            .eq('id', id)
            .single()

        if (error) {
            console.error('Error fetching worklog by id:', error)
            return
        }

        if (data) {
            const formattedLog: Worklog = {
                id: data.id,
                date: data.work_date,
                team: data.group?.name || 'Unknown',
                type: data.shift_type === 'A' ? '주간' : '야간',
                workers: {
                    director: data.worklog_staff?.filter((s: any) => s.role === 'main_director').map((s: any) => s.user?.name || s.support_staff?.name) || [],
                    assistant: data.worklog_staff?.filter((s: any) => s.role === 'sub_director').map((s: any) => s.user?.name || s.support_staff?.name) || [],
                    video: data.worklog_staff?.filter((s: any) => s.role === 'tech_staff').map((s: any) => s.user?.name || s.support_staff?.name) || []
                },
                status: data.status,
                signature: "0/4",
                isImportant: false,
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
        }
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
        if (updates.type) dbUpdates.shift_type = updates.type === '주간' ? 'A' : 'N'
        if (updates.aiSummary) dbUpdates.ai_summary = updates.aiSummary
        // if (updates.systemIssues) dbUpdates.system_issues = updates.systemIssues // Column missing in DB

        const { error } = await supabase
            .from('worklogs')
            .update(dbUpdates)
            .eq('id', id)

        if (error) {
            console.error('Error updating worklog:', JSON.stringify(error, null, 2))
            // Revert optimistic update if needed? For now, we'll just log error.
            // Ideally we should fetch the original state back.
            return
        }
        // We don't need to fetch all worklogs again if we trust our optimistic update.
        // But to be safe and sync with other users, we could. 
        // For now, let's skip the heavy fetchWorklogs() call to prevent overwriting with stale data if it's slow.
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
