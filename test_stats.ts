
import { getStatisticsData } from './app/statistics/actions'

async function test() {
    try {
        console.log("Fetching statistics data...")
        const data = await getStatisticsData()
        console.log("Data fetched successfully:")
        console.log("Total Modifications:", data.totalModifications)
        console.log("Daily Stats Count:", data.dailyStats.length)
        console.log("Channel Stats:", JSON.stringify(data.channelStats, null, 2))

        if (data.dailyStats.length > 0) {
            console.log("First Daily Stat:", JSON.stringify(data.dailyStats[0], null, 2))
        }
    } catch (error) {
        console.error("Error fetching data:", error)
    }
}

test()
