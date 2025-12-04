"use client"

import { useState, useEffect, useMemo } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, Paperclip, X, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { usePostStore } from "@/store/posts"
import { toast } from "sonner"
import dynamic from "next/dynamic"
import "react-quill-new/dist/quill.snow.css"
import { useAuthStore } from "@/store/auth"
import { useWorklogStore, ChannelLog } from "@/store/worklog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

// Dynamic import for React Quill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false })

export default function NewPostPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const worklogId = searchParams.get("worklogId")
    const channelName = searchParams.get("channel")
    const sourceField = searchParams.get("sourceField")
    const categorySlugParam = searchParams.get("categorySlug")
    const tagParam = searchParams.get("tag")

    const { categories, addPost, fetchCategories } = usePostStore()
    const { user, currentSession } = useAuthStore()

    const [authorId, setAuthorId] = useState("")

    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [categoryId, setCategoryId] = useState("")
    const [priority, setPriority] = useState<"일반" | "중요" | "긴급">("일반")
    const [attachments, setAttachments] = useState<File[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const [tags, setTags] = useState<string[]>([])
    const [tagInput, setTagInput] = useState("")
    const [summary, setSummary] = useState("")
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
    const [isModuleLoaded, setIsModuleLoaded] = useState(false)
    const [quillClass, setQuillClass] = useState<any>(null)

    // Confirmation Dialog State
    const [showConfirmDialog, setShowConfirmDialog] = useState(false)
    const [displayAuthorName, setDisplayAuthorName] = useState("")

    useEffect(() => {
        fetchCategories()
    }, [])

    // Async module loading for Quill Blot Formatter
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const loadModule = async () => {
                try {
                    const { default: QuillComponent, Quill } = await import('react-quill-new')
                    const { default: BlotFormatter } = await import('quill-blot-formatter')

                    // Custom Image Blot to preserve inline styles
                    const Image = Quill.import('formats/image') as any
                    class CustomImage extends Image {
                        static blotName = 'image'
                        static tagName = 'IMG'

                        static create(value: any) {
                            const node = super.create(value)
                            if (typeof value === 'object') {
                                // Handle object value (e.g. from clipboard)
                                if (value.url) node.setAttribute('src', value.url)
                                if (value.style) node.setAttribute('style', value.style)
                                if (value.width) node.setAttribute('width', value.width)
                                if (value.height) node.setAttribute('height', value.height)
                            }
                            return node
                        }

                        static value(node: any) {
                            return {
                                url: node.getAttribute('src'),
                                style: node.getAttribute('style'),
                                width: node.getAttribute('width'),
                                height: node.getAttribute('height')
                            }
                        }
                    }

                    Quill.register(CustomImage as any, true)

                    if (Quill && !Quill.imports['modules/blotFormatter']) {
                        Quill.register('modules/blotFormatter', BlotFormatter)
                    }
                    setQuillClass(() => Quill)
                    setIsModuleLoaded(true)
                } catch (error) {
                    console.error('Error loading Quill modules:', error)
                }
            }
            loadModule()
        }
    }, [])

    // Find category to auto-select and set initial tags
    useEffect(() => {
        if (categories.length > 0) {
            if (categorySlugParam) {
                const targetCat = categories.find(c => c.slug === categorySlugParam)
                if (targetCat) setCategoryId(targetCat.id)
            } else if (channelName) {
                const channelCat = categories.find(c => c.slug === 'channel-operation')
                if (channelCat) setCategoryId(channelCat.id)
            }

            const initialTags = []
            if (tagParam) initialTags.push(tagParam)
            if (channelName && !initialTags.includes(channelName)) initialTags.push(channelName)

            if (initialTags.length > 0) {
                setTags(initialTags)
            }

            if (channelName) {
                setTitle(`${channelName} 운행 이슈`)
            } else if (sourceField === 'systemIssues') {
                setTitle("장비 및 시스템 주요사항")
            }
        }
    }, [channelName, categorySlugParam, tagParam, sourceField, categories])

    // Set default author and worklog
    useEffect(() => {
        // Default to Group (represented by "GROUP" value) if session exists
        if (currentSession && !authorId) {
            setAuthorId("GROUP")
        } else if (user && !authorId) {
            setAuthorId(user.id)
        }
    }, [currentSession, user])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments(prev => [...prev, ...Array.from(e.target.files!)])
        }
    }

    const removeFile = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index))
    }

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault()
            if (!tags.includes(tagInput.trim())) {
                setTags([...tags, tagInput.trim()])
            }
            setTagInput("")
        } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
            setTags(tags.slice(0, -1))
        }
    }

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove))
    }

    const generateSummary = async (text: string) => {
        console.log('=== generateSummary called ===')
        console.log('Text length:', text.length)
        console.log('Text preview:', text.substring(0, 100))

        try {
            console.log('Fetching /api/post-summary...')
            const response = await fetch('/api/post-summary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    content: text,
                    title: title,
                    category: categories.find(c => c.id === categoryId)?.name || ''
                }),
            })

            console.log('Response status:', response.status)
            console.log('Response ok:', response.ok)

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                console.error('API error response:', errorData)
                throw new Error('AI 요약 생성 실패')
            }

            const data = await response.json()
            console.log('Received data:', data)
            return data
        } catch (error) {
            console.error('=== Summary generation error ===')
            console.error('Error:', error)
            throw error // Rethrow to let the caller handle it
        }
    }

    const handleGenerateSummary = async () => {
        const plainText = content.replace(/<[^>]*>?/gm, '').trim()
        if (!plainText) {
            toast.error("요약할 본문 내용을 입력해주세요.")
            return
        }

        setIsGeneratingSummary(true)
        try {
            const { summary, title } = await generateSummary(plainText)
            setSummary(summary)
            if (title) setTitle(title)
            toast.success("AI 요약이 생성되었습니다.")
        } catch (error) {
            console.error(error)
            toast.error(`요약 생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
        } finally {
            setIsGeneratingSummary(false)
        }
    }

    const handlePreSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!title || !content || !categoryId) {
            toast.error("필수 항목을 입력해주세요.")
            return
        }

        // Calculate Display Author Name
        let name = ""
        if (currentSession) {
            if (authorId === 'GROUP') {
                name = `${currentSession.groupName} (공동대표)`
            } else {
                const member = currentSession.members.find(m => m.id === authorId)
                name = member ? member.name : "알 수 없음"
            }
        } else {
            name = user?.name || "알 수 없음"
        }
        setDisplayAuthorName(name)
        setShowConfirmDialog(true)
    }

    const handleFinalSubmit = async () => {
        setIsSaving(true)
        setShowConfirmDialog(false)

        try {
            // 1. Upload files (Mock for now, just storing metadata)
            const attachmentMeta = attachments.map(file => ({
                name: file.name,
                url: URL.createObjectURL(file), // Mock URL
                type: file.type,
                size: file.size
            }))

            // 2. Determine author_id and created_by
            let finalAuthorId: string | undefined = undefined;
            let finalCreatedBy: string | undefined = user?.id;

            if (currentSession) {
                // Group Session: Always a group post (author_id = null/undefined)
                // created_by reflects the actual writer (selected member or logged-in user)
                finalAuthorId = undefined;
                if (authorId && authorId !== 'GROUP') {
                    finalCreatedBy = authorId;
                }
            } else {
                // Individual Session
                finalAuthorId = user?.id;
                finalCreatedBy = user?.id;
            }

            // 3. Create Post
            const postData = {
                title,
                content,
                category_id: categoryId,
                priority,
                worklog_id: worklogId || currentSession?.id || undefined,
                channel: channelName || undefined,
                attachments: attachmentMeta,
                summary: summary || undefined,
                tags,
                author_id: finalAuthorId,
                created_by: finalCreatedBy
            }

            console.log('Sending post data:', postData)

            const newPost = await addPost(postData)

            if (worklogId && sourceField) {
                const worklogStore = useWorklogStore.getState()
                await worklogStore.fetchWorklogs() // Refresh to get latest state
                const currentWorklog = worklogStore.worklogs.find(w => String(w.id) === worklogId)

                if (currentWorklog) {
                    const postSummary = {
                        id: newPost.id,
                        summary: summary || title // Use summary if available, else title
                    }

                    if (sourceField === 'systemIssues') {
                        const currentIssues = currentWorklog.systemIssues || []
                        await worklogStore.updateWorklog(worklogId, {
                            systemIssues: [...currentIssues, postSummary]
                        })
                    } else {
                        // Assume sourceField is channel name
                        const currentChannelLogs = currentWorklog.channelLogs || {}
                        const currentChannelLog = currentChannelLogs[sourceField] || { posts: [], timecodes: {} }

                        await worklogStore.updateWorklog(worklogId, {
                            channelLogs: {
                                ...currentChannelLogs,
                                [sourceField]: {
                                    ...currentChannelLog,
                                    posts: [...(currentChannelLog.posts || []), postSummary]
                                }
                            }
                        })
                    }
                    toast.success("업무일지에 요약이 반영되었습니다.")
                }
            }

            toast.success("포스트가 저장되었습니다.")

            if (worklogId) {
                router.push(`/worklog?id=${worklogId}`)
            } else {
                router.push('/posts')
            }

        } catch (error: any) {
            console.error('Save error:', error)
            toast.error(`저장 중 오류가 발생했습니다: ${error.message || error.details || '알 수 없는 오류'}`)
        } finally {
            setIsSaving(false)
        }
    }

    const modules = useMemo(() => {
        if (!quillClass) return null

        return {
            toolbar: [
                [{ header: [1, 2, false] }],
                ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['link', 'image'],
                ['clean']
            ],
            blotFormatter: {}
        }
    }, [quillClass])

    return (
        <MainLayout>
            <style jsx global>{`
                .ql-editor img {
                    vertical-align: bottom;
                }
                .ql-editor .image-resizer {
                    display: inline-block !important;
                }
            `}</style>
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-2xl font-bold">새 포스트 작성</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>포스트 내용</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePreSubmit} className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label>작성자</Label>
                                    <Select value={authorId} onValueChange={setAuthorId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="작성자 선택" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {currentSession && (
                                                <SelectItem value="GROUP">
                                                    {currentSession.groupName} (공동대표)
                                                </SelectItem>
                                            )}
                                            {currentSession?.members?.map(member => (
                                                <SelectItem key={member.id} value={member.id}>
                                                    {member.name} ({member.role})
                                                </SelectItem>
                                            ))}
                                            {!currentSession && user && (
                                                <SelectItem value={user.id}>
                                                    {user.name}
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>카테고리</Label>
                                    <Select value={categoryId} onValueChange={setCategoryId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="카테고리 선택" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map(c => (
                                                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>우선순위</Label>
                                    <Select value={priority} onValueChange={(value) => setPriority(value as "일반" | "중요" | "긴급")}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="우선순위 선택" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="일반">일반</SelectItem>
                                            <SelectItem value="중요">중요</SelectItem>
                                            <SelectItem value="긴급">긴급</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>제목</Label>
                                <Input
                                    placeholder="제목을 입력하세요"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>

                            {/* AI Summary Section */}
                            <div className="space-y-2 p-4 bg-muted/30 rounded-lg border border-blue-100">
                                <div className="flex items-center justify-between mb-2">
                                    <Label className="text-blue-600 font-bold flex items-center gap-2">
                                        ✨ AI 요약
                                    </Label>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={handleGenerateSummary}
                                        disabled={isGeneratingSummary}
                                        className="h-7 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
                                    >
                                        {isGeneratingSummary ? (
                                            <>
                                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                                생성 중...
                                            </>
                                        ) : (
                                            "AI 요약 생성"
                                        )}
                                    </Button>
                                </div>
                                <Input
                                    placeholder="AI 요약 생성 버튼을 누르거나 직접 입력하세요 (40자 이내 권장)"
                                    value={summary}
                                    onChange={(e) => setSummary(e.target.value)}
                                    className="bg-white"
                                />
                                <p className="text-xs text-muted-foreground">
                                    * 업무일지 연동 시 이 요약 내용이 채널 메모로 저장됩니다.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label>태그</Label>
                                <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                                    {tags.map(tag => (
                                        <div key={tag} className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm">
                                            <span>#{tag}</span>
                                            <button type="button" onClick={() => removeTag(tag)}>
                                                <X className="h-3 w-3 hover:text-foreground" />
                                            </button>
                                        </div>
                                    ))}
                                    <input
                                        className="flex-1 bg-transparent outline-none min-w-[100px] text-sm"
                                        placeholder="태그 입력 (Enter로 추가)"
                                        value={tagInput}
                                        onChange={(e) => setTagInput(e.target.value)}
                                        onKeyDown={handleTagKeyDown}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>내용</Label>
                                <div className="h-[400px] mb-12">
                                    {isModuleLoaded && modules ? (
                                        <ReactQuill
                                            theme="snow"
                                            value={content}
                                            onChange={setContent}
                                            modules={modules}
                                            className="h-full"
                                        />
                                    ) : (
                                        <div className="h-full flex items-center justify-center bg-muted/20 rounded-md border">
                                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2 pt-4">
                                <Label>첨부파일</Label>
                                <div className="flex items-center gap-4">
                                    <Button type="button" variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                                        <Paperclip className="mr-2 h-4 w-4" /> 파일 선택
                                    </Button>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        multiple
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                    <span className="text-sm text-muted-foreground">
                                        {attachments.length}개 파일 선택됨
                                    </span>
                                </div>
                                {attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {attachments.map((file, i) => (
                                            <div key={i} className="flex items-center gap-2 bg-muted px-3 py-1 rounded-full text-sm">
                                                <span>{file.name}</span>
                                                <button type="button" onClick={() => removeFile(i)}>
                                                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button type="button" variant="outline" onClick={() => router.back()}>
                                    취소
                                </Button>
                                <Button type="submit" disabled={isSaving}>
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            저장 중...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            저장
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent >
                </Card >

                <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>포스트 작성 확인</AlertDialogTitle>
                            <AlertDialogDescription className="space-y-2">
                                <span className="block">이 포스트는 <span className="font-bold text-foreground">{displayAuthorName}</span> 명의로 등록됩니다.</span>
                                <span className="block">계속 진행하시겠습니까?</span>
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction onClick={handleFinalSubmit}>등록</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div >
        </MainLayout >
    )
}
