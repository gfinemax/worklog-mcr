
'use server'

import { createClient } from '@/lib/supabase-server'
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'

export interface DailyStats {
    date: string
    totalModifications: number
    channelCounts: { [channel: string]: number }
}

export interface ChannelStats {
    name: string
    count: number
    fill: string
}

export async function getStatisticsData(days = 30) {
    const supabase = await createClient()
    const endDate = new Date()
    const startDate = subDays(endDate, days)

    const { data: worklogs, error } = await supabase
        .from('worklogs')
        .select('date, channel_logs')
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: true })

    if (error) {
        console.error('Error fetching statistics:', error)
        return { dailyStats: [], channelStats: [], totalModifications: 0 }
    }

    // Initialize daily stats map
    const dailyMap = new Map<string, DailyStats>()
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate })

    dateRange.forEach(date => {
        const dateStr = format(date, 'yyyy-MM-dd')
        dailyMap.set(dateStr, {
            date: format(date, 'MM/dd'),
            totalModifications: 0,
            channelCounts: {}
        })
    })

    const channelAggregates: { [channel: string]: number } = {}
    let totalModifications = 0

    worklogs?.forEach(log => {
        const dateStr = log.date
        const stats = dailyMap.get(dateStr)
        if (!stats) return

        const channelLogs = log.channel_logs as any
        if (!channelLogs) return

        Object.entries(channelLogs).forEach(([channel, data]: [string, any]) => {
            const timecodes = data.timecodes
            if (timecodes) {
                const count = Object.keys(timecodes).length
                if (count > 0) {
                    stats.totalModifications += count
                    stats.channelCounts[channel] = (stats.channelCounts[channel] || 0) + count

                    channelAggregates[channel] = (channelAggregates[channel] || 0) + count
                    totalModifications += count
                }
            }
        })
    })

    // Convert map to array
    const dailyStats = Array.from(dailyMap.values())

    // Convert channel aggregates to array for charts
    const channelColors: { [key: string]: string } = {
        "MBC SPORTS+": "#ef4444", // Red
        "MBC Every1": "#f59e0b", // Amber
        "MBC DRAMA": "#8b5cf6", // Violet
        "MBC M": "#ec4899", // Pink
        "MBC ON": "#3b82f6", // Blue
    }

    const channelStats: ChannelStats[] = Object.entries(channelAggregates)
        .map(([name, count]) => ({
            name,
            count,
            fill: channelColors[name] || "#94a3b8" // Default slate
        }))
        .sort((a, b) => b.count - a.count)

    return {
        dailyStats,
        channelStats,
        totalModifications
    }
}
