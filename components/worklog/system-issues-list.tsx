"use client"

import { useRouter } from "next/navigation"

export interface SystemIssuesListProps {
    issues: { id: string; summary: string }[]
    onIssuesChange: (issues: { id: string; summary: string }[]) => void
    onNewPost: () => void
}

export function SystemIssuesList({
    issues,
    onIssuesChange,
    onNewPost
}: SystemIssuesListProps) {
    const router = useRouter()

    const handlePostClick = (postId: string) => {
        router.push(`/posts/${postId}`)
    }

    return (
        <div className="h-full w-full p-1 overflow-y-auto">
            {issues && issues.length > 0 ? (
                <ul className="list-none space-y-1">
                    {issues.map(issue => (
                        <li key={issue.id}
                            onClick={() => handlePostClick(issue.id)}
                            className="cursor-pointer hover:bg-gray-100 rounded text-sm group flex items-start"
                        >
                            <span className="mr-1">•</span>
                            <span className="group-hover:underline">{issue.summary}</span>
                        </li>
                    ))}
                    <li onClick={onNewPost} className="cursor-pointer text-gray-400 hover:text-gray-600 text-sm mt-1 print:hidden">
                        + 추가
                    </li>
                </ul>
            ) : (
                <div
                    onClick={onNewPost}
                    className="h-full w-full text-sm text-gray-400 cursor-pointer hover:bg-gray-50 flex items-start pt-1"
                >
                    특이사항 없음
                </div>
            )}
        </div>
    )
}
