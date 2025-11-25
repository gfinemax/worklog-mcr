import { create } from 'zustand'

export interface Worklog {
    id: number
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
    addWorklog: (worklog: Worklog) => void
    updateWorklog: (id: number, updates: Partial<Worklog>) => void
}

export const useWorklogStore = create<WorklogStore>((set) => ({
    worklogs: [
        {
            id: 0,
            date: "2025-11-25",
            team: "1조",
            type: "야간",
            workers: {
                director: ["김철수"],
                assistant: ["이영희"],
                video: ["박민수"]
            },
            status: "작성중",
            signature: "1/4",
            isImportant: false,
        },
        {
            id: 1,
            date: "2025-11-20",
            team: "3조",
            type: "주간",
            workers: {
                director: ["김주조"],
                assistant: ["이부감"],
                video: ["박영상"]
            },
            status: "근무종료",
            signature: "2/4",
            isImportant: false,
        },
        {
            id: 2,
            date: "2025-11-19",
            team: "2조",
            type: "야간",
            workers: {
                director: ["이영상"],
                assistant: ["김보조"],
                video: ["최비디오"]
            },
            status: "서명완료",
            signature: "4/4",
            isImportant: false,
        },
        {
            id: 3,
            date: "2025-11-19",
            team: "2조",
            type: "주간",
            workers: {
                director: ["박예비"],
                assistant: ["정조수"],
                video: ["강화면"]
            },
            status: "서명완료",
            signature: "4/4",
            isImportant: false,
        },
        {
            id: 4,
            date: "2025-11-18",
            team: "1조",
            type: "야간",
            workers: {
                director: ["최CMS"],
                assistant: ["윤송출"],
                video: ["임화질"]
            },
            status: "서명완료",
            signature: "4/4",
            isImportant: false,
        },
        {
            id: 5,
            date: "2025-11-18",
            team: "1조",
            type: "주간",
            workers: {
                director: ["정주조"],
                assistant: ["한부조"],
                video: ["오영상"]
            },
            status: "서명완료",
            signature: "4/4",
            isImportant: false,
        },
    ],
    addWorklog: (worklog) => set((state) => ({
        worklogs: [worklog, ...state.worklogs]
    })),
    updateWorklog: (id, updates) => set((state) => ({
        worklogs: state.worklogs.map((log) =>
            log.id === id ? { ...log, ...updates } : log
        )
    })),
}))
