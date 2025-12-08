"use client"

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth'
import { shiftService } from '@/lib/shift-rotation'
import { format, subDays } from 'date-fns'

export interface UseWorklogStateProps {
    id: string | null | undefined
    tabDate?: string
    tabType?: string
    tabTeam?: string
}

export interface UseWorklogStateReturn {
    selectedDate: Date
    setSelectedDate: (date: Date) => void
    shiftType: 'day' | 'night'
    setShiftType: (type: 'day' | 'night') => void
    selectedTeam: string | null
    setSelectedTeam: (team: string | null) => void
    hasExplicitProps: boolean
    isInitialized: boolean
}

/**
 * Custom hook for managing worklog state initialization.
 * 
 * Priority:
 * 1. Explicit props from dialog (tabDate, tabType, tabTeam) - HIGHEST
 * 2. Existing worklog data (when id is not 'new')
 * 3. Current session based auto-calculation - LOWEST
 */
export function useWorklogState({
    id,
    tabDate,
    tabType,
    tabTeam
}: UseWorklogStateProps): UseWorklogStateReturn {
    const { currentSession } = useAuthStore()

    // Check if explicit props were provided from dialog
    const hasExplicitProps = !!(tabDate && tabTeam && tabType)

    // Debug: log on every render
    console.log('[useWorklogState] Hook called:', { id, tabDate, tabType, tabTeam, hasExplicitProps })

    // === INITIALIZATION FUNCTIONS ===

    const getInitialDate = (): Date => {
        // Priority 1: Explicit props from dialog
        if (tabDate) {
            const [year, month, day] = tabDate.split('-').map(Number)
            return new Date(year, month - 1, day)
        }
        return new Date()
    }

    const getInitialShiftType = (): 'day' | 'night' => {
        // Priority 1: Explicit props from dialog
        if (tabType === 'day' || tabType === 'night') return tabType
        if (tabType === '주간') return 'day'
        if (tabType === '야간') return 'night'
        return 'day'
    }

    const getInitialTeam = (): string | null => {
        // Priority 1: Explicit props from dialog
        if (tabTeam) return tabTeam
        return null
    }

    // === STATE ===
    const [selectedDate, setSelectedDate] = useState<Date>(getInitialDate)
    const [shiftType, setShiftType] = useState<'day' | 'night'>(getInitialShiftType)
    const [selectedTeam, setSelectedTeam] = useState<string | null>(getInitialTeam)
    const [isInitialized, setIsInitialized] = useState(false)

    // === EFFECTS ===

    // Effect 0a: Sync shiftType when tabType changes (INDEPENDENT of other props)
    useEffect(() => {
        if (!tabType) return

        console.log('[useWorklogState] Syncing shiftType from tabType:', tabType)

        if (tabType === 'day' || tabType === 'night') {
            setShiftType(tabType)
        } else if (tabType === '주간') {
            setShiftType('day')
        } else if (tabType === '야간') {
            setShiftType('night')
        }
    }, [tabType])

    // Effect 0b: Sync team when tabTeam changes (INDEPENDENT of other props)
    useEffect(() => {
        if (!tabTeam) return

        console.log('[useWorklogState] Syncing team from tabTeam:', tabTeam)
        setSelectedTeam(tabTeam)
    }, [tabTeam])

    // Effect 0c: Sync date when tabDate changes (INDEPENDENT of other props)
    useEffect(() => {
        if (!tabDate) return

        console.log('[useWorklogState] Syncing date from tabDate:', tabDate)
        const [year, month, day] = tabDate.split('-').map(Number)
        setSelectedDate(new Date(year, month - 1, day))
    }, [tabDate])

    // Mark initialized when explicit props are available
    useEffect(() => {
        if (hasExplicitProps) {
            setIsInitialized(true)
        }
    }, [hasExplicitProps])

    // Effect 1: Smart initialization (ONLY when hasExplicitProps is FALSE)
    useEffect(() => {
        // Skip if explicit props or existing worklog
        if (hasExplicitProps || (id && id !== 'new')) {
            setIsInitialized(true)
            return
        }

        const initializeSmartShift = async () => {
            const now = new Date()
            let { date: targetDate, shiftType: logicalShiftType } = shiftService.getLogicalShiftInfo(now)

            // If user is logged in, adjust for their current shift
            if (currentSession) {
                const config = await shiftService.getConfig(targetDate)
                if (config) {
                    const teams = shiftService.getTeamsForDate(targetDate, config)
                    if (teams) {
                        // Case 1: Time is Night, but User is Day Team
                        if (logicalShiftType === 'night' && currentSession.groupName === teams.A) {
                            logicalShiftType = 'day'
                        }
                        // Case 2: Time is Day, but User is Night Team
                        else if (logicalShiftType === 'day' && currentSession.groupName === teams.N) {
                            const yesterday = subDays(targetDate, 1)
                            const prevConfig = await shiftService.getConfig(yesterday)
                            if (prevConfig) {
                                const prevTeams = shiftService.getTeamsForDate(yesterday, prevConfig)
                                if (prevTeams && prevTeams.N === currentSession.groupName) {
                                    logicalShiftType = 'night'
                                    targetDate = yesterday
                                }
                            }
                        }
                    }
                }
            }

            setSelectedDate(targetDate)
            setShiftType(logicalShiftType)
            setIsInitialized(true)
        }

        initializeSmartShift()
    }, [id, hasExplicitProps, currentSession])

    // Effect 2: Auto-select team (ONLY when hasExplicitProps is FALSE)
    useEffect(() => {
        // Skip if explicit props or existing worklog
        if (hasExplicitProps || (id && id !== 'new')) return

        // If user is logged in, default to their team
        if (currentSession) {
            if (selectedTeam !== currentSession.groupName) {
                setSelectedTeam(currentSession.groupName)
            }
            return
        }

        // Otherwise, auto-calculate from pattern
        const updateTeamFromPattern = async () => {
            const config = await shiftService.getConfig(selectedDate)
            if (config) {
                const teams = shiftService.getTeamsForDate(selectedDate, config)
                if (teams) {
                    const targetTeam = shiftType === 'day' ? teams.A : teams.N
                    if (targetTeam && targetTeam !== selectedTeam) {
                        setSelectedTeam(targetTeam)
                    }
                }
            }
        }

        updateTeamFromPattern()
    }, [selectedDate, shiftType, id, currentSession, selectedTeam, hasExplicitProps])

    return {
        selectedDate,
        setSelectedDate,
        shiftType,
        setShiftType,
        selectedTeam,
        setSelectedTeam,
        hasExplicitProps,
        isInitialized
    }
}
