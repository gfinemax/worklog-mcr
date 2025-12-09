import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface BroadcastSchedule {
    id: string
    type: 'broadcast' | 'reception'  // 라이브 / 수신
    date: string
    time: string
    channel_name: string
    studio_label?: string            // ST-C, ST-D, ST-A
    program_title: string
    match_info?: string              // 신한은행:하나은행
    transmission_path?: string       // IP RET-1 : FA1AO
    video_source_info?: string       // FA 3A-O, X100-1
    audio_source_info?: string
    send_line?: string               // 송신 라인
    hq_network?: string              // NCC TX-9
    return_info?: string             // 리턴
    broadcast_van?: string           // 중계차
    manager?: string                 // 담당자
    contact_info?: string            // 010-8776-9169
    biss_code?: string               // BISS 코드
    memo?: string
    created_at: string
    updated_at?: string
}

interface BroadcastStore {
    schedules: BroadcastSchedule[]
    loading: boolean
    fetchSchedules: (date?: string) => Promise<void>
    addSchedule: (schedule: Omit<BroadcastSchedule, 'id' | 'created_at'>) => Promise<BroadcastSchedule | null>
    updateSchedule: (id: string, updates: Partial<BroadcastSchedule>) => Promise<{ error: any }>
    deleteSchedule: (id: string) => Promise<{ error: any }>
}

export const useBroadcastStore = create<BroadcastStore>((set, get) => ({
    schedules: [],
    loading: false,

    fetchSchedules: async (date?: string) => {
        set({ loading: true })

        let query = supabase
            .from('broadcast_schedules')
            .select('*')
            .order('date', { ascending: false })
            .order('time', { ascending: true })

        if (date) {
            query = query.eq('date', date)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching broadcast schedules:', error)
            set({ loading: false })
            return
        }

        set({
            schedules: data || [],
            loading: false
        })
    },

    addSchedule: async (schedule) => {
        const { data, error } = await supabase
            .from('broadcast_schedules')
            .insert([schedule])
            .select()
            .single()

        if (error) {
            console.error('Error adding broadcast schedule:', error)
            return null
        }

        // Refresh list
        get().fetchSchedules()
        return data
    },

    updateSchedule: async (id, updates) => {
        // Optimistic update
        set(state => ({
            schedules: state.schedules.map(s =>
                s.id === id ? { ...s, ...updates } : s
            )
        }))

        const { error } = await supabase
            .from('broadcast_schedules')
            .update(updates)
            .eq('id', id)

        if (error) {
            console.error('Error updating broadcast schedule:', error)
            return { error }
        }

        return { error: null }
    },

    deleteSchedule: async (id) => {
        const { error } = await supabase
            .from('broadcast_schedules')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting broadcast schedule:', error)
            return { error }
        }

        set(state => ({
            schedules: state.schedules.filter(s => s.id !== id)
        }))

        return { error: null }
    }
}))
