
'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts'
import { getStatisticsData, DailyStats, ChannelStats } from './actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Activity, BarChart3, PieChart as PieChartIcon, TrendingUp, Calendar } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

import { MainLayout } from '@/components/layout/main-layout'

export default function StatisticsPage() {
    const [dailyStats, setDailyStats] = useState<DailyStats[]>([])
    const [channelStats, setChannelStats] = useState<ChannelStats[]>([])
    const [totalMods, setTotalMods] = useState(0)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            const data = await getStatisticsData()
            setDailyStats(data.dailyStats)
            setChannelStats(data.channelStats)
            setTotalMods(data.totalModifications)
            setLoading(false)
        }
        fetchData()
    }, [])

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    }

    if (loading) {
        return (
            <MainLayout>
                <div className="p-8 space-y-8">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-10 w-48" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {[1, 2, 3, 4].map(i => (
                            <Skeleton key={i} className="h-32 rounded-xl" />
                        ))}
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Skeleton className="col-span-4 h-[400px] rounded-xl" />
                        <Skeleton className="col-span-3 h-[400px] rounded-xl" />
                    </div>
                </div>
            </MainLayout>
        )
    }

    return (
        <MainLayout>
            <motion.div
                className="flex-1 space-y-8 p-8 pt-6"
                variants={container}
                initial="hidden"
                animate="show"
            >
                <div className="flex items-center justify-between space-y-2">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">통계 대시보드</h2>
                        <p className="text-muted-foreground">
                            최근 30일간의 운행표 수정 현황 및 채널별 통계입니다.
                        </p>
                    </div>
                </div>

                {/* Key Metrics Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <motion.div variants={item}>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">총 수정 건수</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{totalMods}</div>
                                <p className="text-xs text-muted-foreground">
                                    최근 30일 기준
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                    <motion.div variants={item}>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">일평균 수정</CardTitle>
                                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {(totalMods / 30).toFixed(1)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    건 / 일
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                    <motion.div variants={item}>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">최다 수정 채널</CardTitle>
                                <PieChartIcon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold truncate">
                                    {channelStats[0]?.name || '-'}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {channelStats[0]?.count || 0} 건
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                    <motion.div variants={item}>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">수정 추세</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {dailyStats.length > 0 && dailyStats[dailyStats.length - 1].totalModifications > dailyStats[0].totalModifications ? '상승' : '하락'}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    지난달 대비
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Charts Area */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    {/* Daily Trend Chart */}
                    <motion.div variants={item} className="col-span-4">
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle>일별 수정 추이</CardTitle>
                                <CardDescription>
                                    날짜별 운행표 수정 건수 변화 그래프입니다.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <div className="h-[350px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={dailyStats}>
                                            <defs>
                                                <linearGradient id="colorMods" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                                            <XAxis
                                                dataKey="date"
                                                stroke="#888888"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <YAxis
                                                stroke="#888888"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => `${value}`}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                    borderRadius: '8px',
                                                    border: '1px solid #e2e8f0',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="totalModifications"
                                                stroke="#3b82f6"
                                                strokeWidth={2}
                                                fillOpacity={1}
                                                fill="url(#colorMods)"
                                                name="수정 건수"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Channel Distribution Chart */}
                    <motion.div variants={item} className="col-span-3">
                        <Card className="h-full">
                            <CardHeader>
                                <CardTitle>채널별 비중</CardTitle>
                                <CardDescription>
                                    전체 수정 건수 중 각 채널이 차지하는 비율입니다.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[350px] w-full flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={channelStats}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={2}
                                                dataKey="count"
                                            >
                                                {channelStats.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                                    borderRadius: '8px',
                                                    border: '1px solid #e2e8f0',
                                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                                    {channelStats.map((channel, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                            <div
                                                className="h-3 w-3 rounded-full"
                                                style={{ backgroundColor: channel.fill }}
                                            />
                                            <span className="truncate text-muted-foreground">
                                                {channel.name}
                                            </span>
                                            <span className="ml-auto font-medium">
                                                {((channel.count / totalMods) * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </motion.div>
        </MainLayout>
    )
}
