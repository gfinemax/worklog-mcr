'use client'

import * as React from 'react'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

export interface ConfirmationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: React.ReactNode
    confirmText?: string
    cancelText?: string
    onConfirm: () => void | Promise<void>
    variant?: 'default' | 'destructive' | 'warning'
    loading?: boolean
}

/**
 * 재사용 가능한 확인 다이얼로그 컴포넌트
 * 위험한 작업(삭제, 데이터 초기화 등) 전 사용자 확인을 요청합니다.
 */
export function ConfirmationDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmText = '확인',
    cancelText = '취소',
    onConfirm,
    variant = 'default',
    loading = false,
}: ConfirmationDialogProps) {
    const [isLoading, setIsLoading] = React.useState(false)

    const handleConfirm = async () => {
        setIsLoading(true)
        try {
            await onConfirm()
            onOpenChange(false)
        } catch (error) {
            console.error('Confirmation action failed:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const actionButtonClasses = cn(
        variant === 'destructive' && 'bg-red-600 hover:bg-red-700 text-white',
        variant === 'warning' && 'bg-amber-600 hover:bg-amber-700 text-white'
    )

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription asChild>
                        <div>{description}</div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isLoading || loading}>
                        {cancelText}
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={isLoading || loading}
                        className={actionButtonClasses}
                    >
                        {(isLoading || loading) ? '처리 중...' : confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}

/**
 * 삭제 확인용 프리셋 다이얼로그
 */
export function DeleteConfirmationDialog({
    open,
    onOpenChange,
    itemName,
    onConfirm,
    loading,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    itemName: string
    onConfirm: () => void | Promise<void>
    loading?: boolean
}) {
    return (
        <ConfirmationDialog
            open={open}
            onOpenChange={onOpenChange}
            title="삭제 확인"
            description={
                <span>
                    <strong className="text-foreground">{itemName}</strong>을(를) 정말 삭제하시겠습니까?
                    <br />
                    <span className="text-red-500 text-sm mt-2 block">
                        ⚠️ 이 작업은 되돌릴 수 없습니다.
                    </span>
                </span>
            }
            confirmText="삭제"
            variant="destructive"
            onConfirm={onConfirm}
            loading={loading}
        />
    )
}

/**
 * 데이터 손실 경고 다이얼로그
 */
export function DataLossWarningDialog({
    open,
    onOpenChange,
    action,
    affectedData,
    onConfirm,
    loading,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    action: string
    affectedData: string
    onConfirm: () => void | Promise<void>
    loading?: boolean
}) {
    return (
        <ConfirmationDialog
            open={open}
            onOpenChange={onOpenChange}
            title="데이터 손실 경고"
            description={
                <span>
                    <strong className="text-foreground">{action}</strong> 시 다음 데이터가 영향을 받습니다:
                    <br />
                    <span className="text-amber-600 font-medium">{affectedData}</span>
                    <br />
                    <span className="text-muted-foreground text-sm mt-2 block">
                        계속 진행하시겠습니까?
                    </span>
                </span>
            }
            confirmText="계속 진행"
            variant="warning"
            onConfirm={onConfirm}
            loading={loading}
        />
    )
}
