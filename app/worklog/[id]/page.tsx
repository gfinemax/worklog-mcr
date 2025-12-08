"use client"

import { useEffect } from "react"
import { useRouter, useParams } from "next/navigation"

export default function WorklogDetailPage() {
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    useEffect(() => {
        // Redirect to the main worklog page with the tab parameter
        router.replace(`/worklog?tab=${id}`)
    }, [id, router])

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="animate-pulse text-muted-foreground">
                업무일지 로딩 중...
            </div>
        </div>
    )
}
