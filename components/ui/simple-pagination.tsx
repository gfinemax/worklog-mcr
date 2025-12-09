"use client"

import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface SimplePaginationProps {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    className?: string
}

export function SimplePagination({
    currentPage,
    totalPages,
    onPageChange,
    className
}: SimplePaginationProps) {
    if (totalPages <= 1) return null

    const canGoPrev = currentPage > 1
    const canGoNext = currentPage < totalPages

    return (
        <div className={cn("flex items-center justify-center gap-4 py-4", className)}>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={!canGoPrev}
                className="gap-1"
            >
                <ChevronLeft className="h-4 w-4" />
                이전
            </Button>

            <span className="text-sm text-muted-foreground min-w-[100px] text-center">
                {currentPage} / {totalPages} 페이지
            </span>

            <Button
                variant="ghost"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={!canGoNext}
                className="gap-1"
            >
                다음
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    )
}

// 페이지네이션 유틸리티 훅
export function usePagination<T>(items: T[], pageSize: number = 20) {
    const totalPages = Math.ceil(items.length / pageSize)

    const getPageItems = (page: number): T[] => {
        const start = (page - 1) * pageSize
        return items.slice(start, start + pageSize)
    }

    return {
        totalPages,
        getPageItems,
        totalItems: items.length
    }
}
