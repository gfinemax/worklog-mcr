import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

// 중계 상태 타입
export type BroadcastStatus = 'scheduled' | 'standby' | 'live' | 'completed' | 'issue'

export interface BroadcastSchedule {
    id: string
    type: 'broadcast' | 'reception'  // 라이브 / 수신
    date: string
    time: string
    end_time?: string                // 예정 종료 시간
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
    status?: BroadcastStatus         // 상태: scheduled/standby/live/completed/issue
    actual_end_time?: string         // 실제 종료 시간
    created_at: string
    updated_at?: string
}

// 일단위 요약 타입
export interface DailySummary {
    date: string
    displayDate: string              // 12/08 (월)
    liveCount: number
    liveCompletedCount: number
    receptionCount: number
    receptionCompletedCount: number
    liveDuration: number             // 분 단위
    receptionDuration: number        // 분 단위
    topPrograms: string[]            // 주요 프로그램 (최대 3개)
    hasLiveNow: boolean              // 현재 진행중인 중계 있음
}

interface BroadcastStore {
    schedules: BroadcastSchedule[]
    loading: boolean
    fetchSchedules: (date?: string) => Promise<void>
    addSchedule: (schedule: Omit<BroadcastSchedule, 'id' | 'created_at'>) => Promise<BroadcastSchedule | null>
    updateSchedule: (id: string, updates: Partial<BroadcastSchedule>) => Promise<{ error: any }>
    deleteSchedule: (id: string) => Promise<{ error: any }>
    updateStatus: (id: string, status: BroadcastStatus) => Promise<{ error: any }>
    markCompleted: (id: string) => Promise<{ error: any }>
    getDailySummaries: () => DailySummary[]
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

        const { data, error, status, statusText } = await supabase
            .from('broadcast_schedules')
            .update(updates)
            .eq('id', id)
            .select()

        console.log('Supabase update response:', { data, error, status, statusText, updates })

        if (error) {
            console.error('Error updating broadcast schedule:', error, 'Message:', error.message, 'Code:', error.code)
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
    },

    updateStatus: async (id, status) => {
        // Optimistic update
        set(state => ({
            schedules: state.schedules.map(s =>
                s.id === id ? { ...s, status } : s
            )
        }))

        const { error } = await supabase
            .from('broadcast_schedules')
            .update({ status })
            .eq('id', id)

        if (error) {
            console.error('Error updating broadcast status:', error)
            return { error }
        }

        return { error: null }
    },

    markCompleted: async (id) => {
        const now = new Date().toISOString()

        // Optimistic update
        set(state => ({
            schedules: state.schedules.map(s =>
                s.id === id ? { ...s, status: 'completed' as BroadcastStatus, actual_end_time: now } : s
            )
        }))

        const { error } = await supabase
            .from('broadcast_schedules')
            .update({ status: 'completed', actual_end_time: now })
            .eq('id', id)

        if (error) {
            console.error('Error marking broadcast as completed:', error)
            return { error }
        }

        return { error: null }
    },

    getDailySummaries: () => {
        const { schedules } = get()
        const groupedByDate = new Map<string, BroadcastSchedule[]>()

        // 날짜별 그룹화
        schedules.forEach(schedule => {
            const existing = groupedByDate.get(schedule.date) || []
            groupedByDate.set(schedule.date, [...existing, schedule])
        })

        // 날짜별 요약 생성
        const summaries: DailySummary[] = []

        groupedByDate.forEach((daySchedules, date) => {
            const liveSchedules = daySchedules.filter(s => s.type === 'broadcast')
            const receptionSchedules = daySchedules.filter(s => s.type === 'reception')

            // 날짜 포맷 (12/08 (월))
            const dateObj = new Date(date + 'T00:00:00')
            const dayNames = ['일', '월', '화', '수', '목', '금', '토']
            const displayDate = `${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getDate().toString().padStart(2, '0')} (${dayNames[dateObj.getDay()]})`

            // 방송 시간 계산 (예정 종료 시간 또는 실제 종료 시간 사용)
            const calculateDuration = (schedules: BroadcastSchedule[]) => {
                return schedules.reduce((total, s) => {
                    // 실제 종료 시간이 있으면 사용
                    if (s.actual_end_time) {
                        const start = new Date(`${s.date}T${s.time}`)
                        const end = new Date(s.actual_end_time)
                        return total + Math.max(0, (end.getTime() - start.getTime()) / 60000)
                    }
                    // 예정 종료 시간이 있으면 사용
                    if (s.end_time) {
                        const [sh, sm] = s.time.slice(0, 5).split(':').map(Number)
                        const [eh, em] = s.end_time.slice(0, 5).split(':').map(Number)
                        const duration = (eh * 60 + em) - (sh * 60 + sm)
                        return total + Math.max(0, duration)
                    }
                    return total
                }, 0)
            }

            // 주요 프로그램 (최대 3개)
            const topPrograms = daySchedules
                .slice(0, 3)
                .map(s => s.program_title)

            // 현재 진행중인 중계 확인
            const hasLiveNow = daySchedules.some(s => s.status === 'live')

            summaries.push({
                date,
                displayDate,
                liveCount: liveSchedules.length,
                liveCompletedCount: liveSchedules.filter(s => s.status === 'completed').length,
                receptionCount: receptionSchedules.length,
                receptionCompletedCount: receptionSchedules.filter(s => s.status === 'completed').length,
                liveDuration: calculateDuration(liveSchedules),
                receptionDuration: calculateDuration(receptionSchedules),
                topPrograms,
                hasLiveNow
            })
        })

        // 날짜 내림차순 정렬
        return summaries.sort((a, b) => b.date.localeCompare(a.date))
    }
}))
