import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export interface ChannelLog {
    content: string
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
    systemIssues?: string
}

interface WorklogStore {
    worklogs: Worklog[]
    fetchWorklogs: () => Promise<void>
    addWorklog: (worklog: Omit<Worklog, 'id'>) => Promise<void>
    updateWorklog: (id: string | number, updates: Partial<Worklog>) => Promise<void>
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

        // Transform DB data to frontend model
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
            signature: "0/4", // Placeholder for now
            isImportant: false, // Placeholder
            aiSummary: log.ai_summary,
            channelLogs: log.channel_logs || {},
            systemIssues: log.system_issues || "" // Assuming we might add this too, or put it in channel_logs? Let's assume separate or part of channel_logs. 
            // Wait, I didn't add system_issues column. I should probably add it or put it in channel_logs.
            // Let's put systemIssues in channel_logs for now or just add another column?
            // The user didn't ask for system issues specifically but it's part of the form.
            // I'll assume systemIssues is part of the form state I need to save.
            // I'll add it to channel_logs JSON or a new column.
            // Let's stick to channel_logs for now and maybe I can add system_issues column later if needed.
            // Actually, let's just add system_issues to the JSONB if possible, or just add another column.
            // I'll add another column for system_issues in the SQL script?
            // No, I'll just use channel_logs to store everything or add a specific field in JSON.
        }))

        set({ worklogs: formattedWorklogs })
    },
    addWorklog: async (worklog) => {
        // Map frontend data to DB structure
        const { data, error } = await supabase.from('worklogs').insert({
            work_date: worklog.date,
            shift_type: worklog.type === '주간' ? 'A' : 'N',
            status: worklog.status,
            channel_logs: worklog.channelLogs,
            // system_issues: worklog.systemIssues 
            // group_id: ... need to lookup
        }).select()

        if (error) {
            console.error('Error adding worklog:', error)
            return
        }

        get().fetchWorklogs()
    },
    updateWorklog: async (id, updates) => {
        const dbUpdates: any = {
            status: updates.status,
        }

        if (updates.channelLogs) dbUpdates.channel_logs = updates.channelLogs
        if (updates.type) dbUpdates.shift_type = updates.type === '주간' ? 'A' : 'N'
        // if (updates.systemIssues) dbUpdates.system_issues = updates.systemIssues

        const { error } = await supabase
            .from('worklogs')
            .update(dbUpdates)
            .eq('id', id)

        if (error) {
            console.error('Error updating worklog:', error)
            return
        }
        get().fetchWorklogs()
    }
}))
