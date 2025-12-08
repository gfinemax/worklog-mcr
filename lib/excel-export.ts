import * as XLSX from 'xlsx'
import { Worklog } from '@/store/worklog'
import { format } from 'date-fns'

export const exportWorklogsToExcel = (worklogs: Worklog[], fileName: string = 'worklogs_export.xlsx') => {
    // Flatten data for Excel
    const data = worklogs.map(log => {
        // Format workers
        const directors = log.workers.director.join(', ')
        const assistants = log.workers.assistant.join(', ')
        const videos = log.workers.video.join(', ')

        // Format channel logs summary (count or concise string)
        const channelLogsCount = Object.keys(log.channelLogs || {}).length

        // Format issues
        const issuesCount = log.systemIssues?.length || 0
        const issueTitles = log.systemIssues?.map(i => i.summary).join('; ') || ''

        return {
            '날짜': log.date,
            '근무조': log.groupName,
            '근무형태': log.type,
            '상태': log.status,
            '감독': directors,
            '부감독': assistants,
            '비디오': videos,
            '특이사항 수': channelLogsCount,
            '시스템 이슈 수': issuesCount,
            '주요 이슈': issueTitles,
            'AI 요약': log.aiSummary || '',
            '서명': log.signature || ''
        }
    })

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data)

    // Auto-width columns (simple estimation)
    const colWidths = [
        { wch: 12 }, // Date
        { wch: 8 },  // Team
        { wch: 8 },  // Type
        { wch: 10 }, // Status
        { wch: 20 }, // Director
        { wch: 20 }, // Assistant
        { wch: 20 }, // Video
        { wch: 12 }, // Logs Count
        { wch: 15 }, // Issues Count
        { wch: 40 }, // Issues List
        { wch: 50 }, // Summary
        { wch: 10 }, // Signature
    ]
    worksheet['!cols'] = colWidths

    // Create workbook
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Worklogs')

    // Generate file and trigger download
    XLSX.writeFile(workbook, fileName)
}
