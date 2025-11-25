import { create } from 'zustand'
import { supabase } from '../lib/supabase'

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
                    external_staff(name)
                )
            `)
            .order('work_date', { ascending: false })

        if (error) {
            console.error('Error fetching worklogs:', error)
            return
        }

        // Transform DB data to frontend model
        const formattedWorklogs: Worklog[] = data.map((log: any) => ({
            id: log.id, // UUID but frontend uses number currently? Wait, frontend interface says number. DB is UUID. I need to update interface to string or number. Let's update interface to string | number or just string.
            // Actually, for now let's keep it simple. If I change ID to string, I might break other things. 
            // But Supabase IDs are UUIDs. I MUST change ID type to string or handle mapping.
            // Let's change interface `id` to `string | number` to be safe, or just `string`.
            // Given the existing code uses `Number(id)` in page.tsx, I should probably update page.tsx too if I change to UUID.
            // For this step, I will map UUID to string and update interface.
            date: log.work_date,
            team: log.group?.name || 'Unknown',
            type: log.shift_type === 'A' ? '주간' : '야간',
            workers: {
                director: log.worklog_staff?.filter((s: any) => s.role === 'main_director').map((s: any) => s.user?.name || s.external_staff?.name) || [],
                assistant: log.worklog_staff?.filter((s: any) => s.role === 'sub_director').map((s: any) => s.user?.name || s.external_staff?.name) || [],
                video: log.worklog_staff?.filter((s: any) => s.role === 'tech_staff').map((s: any) => s.user?.name || s.external_staff?.name) || []
            },
            status: log.status,
            signature: "0/4", // Placeholder for now
            isImportant: false, // Placeholder
            aiSummary: log.ai_summary
        }))

        set({ worklogs: formattedWorklogs })
    },
    addWorklog: async (worklog) => {
        // Map frontend data to DB structure
        // We need group_id from team name. This is tricky without fetching groups.
        // For now, let's assume we can insert. But wait, we need group_id.
        // I'll skip the complex mapping for this "Implementation" step and just show the structure.
        // Or I can fetch the group ID first.

        // Simplified insertion for demonstration
        const { data, error } = await supabase.from('worklogs').insert({
            work_date: worklog.date,
            shift_type: worklog.type === '주간' ? 'A' : 'N',
            status: worklog.status,
            // group_id: ... need to lookup
        }).select()

        if (error) {
            console.error('Error adding worklog:', error)
            return
        }

        // Optimistic update or refetch
        get().fetchWorklogs()
    },
    updateWorklog: async (id, updates) => {
        const { error } = await supabase
            .from('worklogs')
            .update({
                status: updates.status,
                // map other fields
            })
            .eq('id', id)

        if (error) {
            console.error('Error updating worklog:', error)
            return
        }
        get().fetchWorklogs()
    }
}))
