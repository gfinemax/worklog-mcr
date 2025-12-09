"use client"

import { cn } from "@/lib/utils"
import { BroadcastStatus } from "@/store/broadcast"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Circle, CircleCheck, CircleAlert, Radio, Clock } from "lucide-react"

interface StatusIndicatorProps {
    status?: BroadcastStatus
    onStatusChange?: (status: BroadcastStatus) => void
    size?: 'sm' | 'md' | 'lg'
    interactive?: boolean
}

const statusConfig: Record<BroadcastStatus, {
    icon: typeof Circle
    color: string
    bgColor: string
    label: string
}> = {
    scheduled: {
        icon: Circle,
        color: 'text-gray-400',
        bgColor: 'bg-gray-100',
        label: '예정'
    },
    standby: {
        icon: Clock,
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-50',
        label: '대기중'
    },
    live: {
        icon: Radio,
        color: 'text-green-500',
        bgColor: 'bg-green-50',
        label: '진행중'
    },
    completed: {
        icon: CircleCheck,
        color: 'text-blue-500',
        bgColor: 'bg-blue-50',
        label: '완료'
    },
    issue: {
        icon: CircleAlert,
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        label: '이슈'
    }
}

export function StatusIndicator({
    status = 'scheduled',
    onStatusChange,
    size = 'md',
    interactive = true
}: StatusIndicatorProps) {
    const config = statusConfig[status]
    const Icon = config.icon

    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6'
    }

    const indicator = (
        <div
            className={cn(
                "flex items-center justify-center rounded-full p-1",
                config.bgColor,
                interactive && "cursor-pointer hover:opacity-80 transition-opacity"
            )}
            title={config.label}
        >
            <Icon className={cn(sizeClasses[size], config.color, status === 'live' && 'animate-pulse')} />
        </div>
    )

    if (!interactive || !onStatusChange) {
        return indicator
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {indicator}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
                {(Object.entries(statusConfig) as [BroadcastStatus, typeof statusConfig.scheduled][]).map(([key, value]) => {
                    const ItemIcon = value.icon
                    return (
                        <DropdownMenuItem
                            key={key}
                            onClick={() => onStatusChange(key)}
                            className={cn(status === key && "bg-accent")}
                        >
                            <ItemIcon className={cn("h-4 w-4 mr-2", value.color)} />
                            {value.label}
                        </DropdownMenuItem>
                    )
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

// 상태별 카운트 표시용 컴포넌트
export function StatusBadge({
    status,
    count
}: {
    status: BroadcastStatus
    count: number
}) {
    const config = statusConfig[status]
    const Icon = config.icon

    return (
        <span className={cn(
            "inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded",
            config.bgColor,
            config.color
        )}>
            <Icon className="h-3 w-3" />
            {count}
        </span>
    )
}
