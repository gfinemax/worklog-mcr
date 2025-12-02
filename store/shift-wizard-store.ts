import { create } from 'zustand'

interface ShiftPatternConfig {
    id?: string
    name: string
    shift_cycle_days: number
    shift_teams: string[]
    shift_times: {
        day_start: string
        day_end: string
        night_start: string
        night_end: string
    }
    description?: string
    valid_from?: string
    valid_to?: string | null
    pattern_json?: any[]
    roles_json?: string[]
}

interface WorkerAssignment {
    workerId: string
    team: string
    role?: string
}

interface ShiftWizardState {
    currentStep: number
    isWizardActive: boolean
    draftConfig: ShiftPatternConfig | null
    draftAssignments: WorkerAssignment[]

    // Actions
    startWizard: (initialData?: { config: ShiftPatternConfig, assignments: WorkerAssignment[] }) => void
    setStep: (step: number) => void
    updateDraftConfig: (config: Partial<ShiftPatternConfig>) => void
    updateDraftAssignments: (assignments: WorkerAssignment[]) => void
    resetWizard: () => void
}

export const useShiftWizardStore = create<ShiftWizardState>((set) => ({
    currentStep: 1,
    isWizardActive: false,
    draftConfig: null,
    draftAssignments: [],

    startWizard: (initialData) => set({
        isWizardActive: true,
        currentStep: 1,
        draftConfig: initialData?.config || {
            name: '',
            shift_cycle_days: 4, // Default 4-jo 2-gyodae
            shift_teams: ['A', 'B', 'C', 'D'],
            shift_times: {
                day_start: '09:00',
                day_end: '18:00',
                night_start: '18:00',
                night_end: '09:00'
            }
        },
        draftAssignments: initialData?.assignments || []
    }),

    setStep: (step) => set({ currentStep: step }),

    updateDraftConfig: (config) => set((state) => ({
        draftConfig: state.draftConfig ? { ...state.draftConfig, ...config } : null
    })),

    updateDraftAssignments: (assignments) => set({ draftAssignments: assignments }),

    resetWizard: () => set({
        isWizardActive: false,
        currentStep: 1,
        draftConfig: null,
        draftAssignments: []
    })
}))
