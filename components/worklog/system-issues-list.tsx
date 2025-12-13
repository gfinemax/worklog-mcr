"use client"

import { useState } from "react"
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

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1)
    const issuesPerPage = 10
    const totalPages = Math.ceil(issues.length / issuesPerPage)
    const startIndex = (currentPage - 1) * issuesPerPage
    const endIndex = startIndex + issuesPerPage
    const currentIssues = issues.slice(startIndex, endIndex)

    const handlePostClick = (postId: string) => {
        router.push(`/posts/${postId}`)
    }

    return (
        <div className="h-full w-full p-1 overflow-y-auto">
            {issues && issues.length > 0 ? (
                <ul className="list-none space-y-1">
                    {currentIssues.map(issue => (
                        <li key={issue.id}
                            onDoubleClick={() => handlePostClick(issue.id)}
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
            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-1 mt-2 text-xs print:hidden">
                    <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-1 py-0.5 text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
                    >
                        ‹
                    </button>
                    <span className="text-gray-600">
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-1 py-0.5 text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
                    >
                        ›
                    </button>
                </div>
            )}
        </div>
    )
}
