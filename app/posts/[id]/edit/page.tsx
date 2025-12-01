"use client"

import { useState, useEffect, useMemo } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, Paperclip, X, Loader2 } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { usePostStore } from "@/store/posts"
import { toast } from "sonner"
import dynamic from "next/dynamic"
import "react-quill-new/dist/quill.snow.css"
import { useAuthStore } from "@/store/auth"

// Dynamic import for React Quill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false })

export default function EditPostPage() {
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    const { posts, fetchPosts, categories, fetchCategories, updatePost } = usePostStore()
    const { user } = useAuthStore()

    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [categoryId, setCategoryId] = useState("")
    const [priority, setPriority] = useState("일반")
    const [attachments, setAttachments] = useState<any[]>([])
    const [newAttachments, setNewAttachments] = useState<File[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const [tags, setTags] = useState<string[]>([])
    const [tagInput, setTagInput] = useState("")
    const [summary, setSummary] = useState("")
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
    const [isModuleLoaded, setIsModuleLoaded] = useState(false)
    const [quillClass, setQuillClass] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetchCategories()
    }, [])

    // Fetch post data
    useEffect(() => {
        const loadPost = async () => {
            let post = posts.find(p => p.id === id)
            if (!post) {
                await fetchPosts()
                post = usePostStore.getState().posts.find(p => p.id === id)
            }

            if (post) {
                // Check authorization
                // Check authorization
                const hasPermission =
                    (user && post.author_id === user.id) ||
                    (user && post.created_by === user.id) ||
                    (useAuthStore.getState().activeMemberId && useAuthStore.getState().activeMemberId !== "GROUP_COMMON" && post.created_by === useAuthStore.getState().activeMemberId) ||
                    (user && post.worklog?.group?.id === user.id)

                if (!hasPermission) {
                    toast.error("수정 권한이 없습니다.")
                    router.push(`/posts/${id}`)
                    return
                }

                setTitle(post.title)
                setContent(post.content)
                setCategoryId(post.category_id)
                setPriority(post.priority)
                setTags(post.tags || [])
                setSummary(post.summary || "")
                setAttachments(post.attachments || [])
                setIsLoading(false)
            } else {
                toast.error("포스트를 찾을 수 없습니다.")
                router.push("/posts")
            }
        }

        if (user) {
            loadPost()
        }
    }, [id, posts, fetchPosts, user, router])

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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setNewAttachments(prev => [...prev, ...Array.from(e.target.files!)])
        }
    }

    const removeNewFile = (index: number) => {
        setNewAttachments(prev => prev.filter((_, i) => i !== index))
    }

    const removeExistingFile = (index: number) => {
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

    const handleGenerateSummary = async () => {
        const plainText = content.replace(/<[^>]*>?/gm, '').trim()
        if (!plainText) {
            toast.error("요약할 본문 내용을 입력해주세요.")
            return
        }

        setIsGeneratingSummary(true)
        try {
            // Find category name
            const category = categories.find(c => c.id === categoryId)?.name || '일반'

            const response = await fetch('/api/post-summary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    content: plainText,
                    category,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.details || data.error || '요약 생성 실패')
            }

            setSummary(data.summary)
            if (data.title) setTitle(data.title)
            toast.success("AI 요약이 생성되었습니다.")
        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "요약 생성 중 오류가 발생했습니다.")
        } finally {
            setIsGeneratingSummary(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!user) {
            toast.error("로그인이 필요합니다.")
            return
        }

        if (!title || !content || !categoryId) {
            toast.error("필수 항목을 입력해주세요.")
            return
        }

        setIsSaving(true)
        try {
            // 1. Upload new files (Mock for now)
            const newAttachmentMeta = newAttachments.map(file => ({
                name: file.name,
                url: URL.createObjectURL(file), // Mock URL
                type: file.type,
                size: file.size
            }))

            const finalAttachments = [...attachments, ...newAttachmentMeta]

            // 2. Update Post
            const updates = {
                title,
                content,
                category_id: categoryId,
                priority: priority as any,
                attachments: finalAttachments,
                summary: summary || undefined,
                tags,
            }

            await updatePost(id, updates)

            toast.success("포스트가 수정되었습니다.")
            router.push(`/posts/${id}`)

        } catch (error: any) {
            console.error('Save error:', error)
            toast.error(`수정 중 오류가 발생했습니다: ${error.message || '알 수 없는 오류'}`)
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

    if (isLoading) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-[50vh]">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </MainLayout>
        )
    }

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
                    <h1 className="text-2xl font-bold">포스트 수정</h1>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>포스트 내용</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
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
                                    <Select value={priority} onValueChange={setPriority}>
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
                                            summary ? "AI 요약 재생성" : "AI 요약 생성"
                                        )}
                                    </Button>
                                </div>
                                <Input
                                    placeholder="AI 요약 생성 버튼을 누르거나 직접 입력하세요 (40자 이내 권장)"
                                    value={summary}
                                    onChange={(e) => setSummary(e.target.value)}
                                    className="bg-white"
                                />
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
                                        <Paperclip className="mr-2 h-4 w-4" /> 파일 추가
                                    </Button>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        multiple
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </div>

                                {/* Existing Attachments */}
                                {attachments.length > 0 && (
                                    <div className="mt-2">
                                        <Label className="text-xs text-muted-foreground mb-1 block">기존 파일</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {attachments.map((file, i) => (
                                                <div key={i} className="flex items-center gap-2 bg-muted px-3 py-1 rounded-full text-sm border border-blue-100">
                                                    <span>{file.name}</span>
                                                    <button type="button" onClick={() => removeExistingFile(i)}>
                                                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* New Attachments */}
                                {newAttachments.length > 0 && (
                                    <div className="mt-2">
                                        <Label className="text-xs text-muted-foreground mb-1 block">새로 추가된 파일</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {newAttachments.map((file, i) => (
                                                <div key={i} className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full text-sm border border-green-100">
                                                    <span>{file.name}</span>
                                                    <button type="button" onClick={() => removeNewFile(i)}>
                                                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
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
                                            수정 완료
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    )
}
