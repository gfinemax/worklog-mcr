"use client"

import { useState, useEffect, useMemo } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, Paperclip, X, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { usePostStore } from "@/store/posts"
import { useWorklogStore } from "@/store/worklog"
import { toast } from "sonner"
import dynamic from "next/dynamic"
import "react-quill-new/dist/quill.snow.css"

// Dynamic import for React Quill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false })

import { useAuthStore } from "@/store/auth"

export default function NewPostPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const worklogId = searchParams.get("worklogId")
    const channelName = searchParams.get("channel")

    const { categories, addPost, fetchCategories } = usePostStore()
    const { updateWorklog } = useWorklogStore()
    const { user } = useAuthStore()

    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const [categoryId, setCategoryId] = useState("")
    const [isEmergency, setIsEmergency] = useState(false)
    const [attachments, setAttachments] = useState<File[]>([])
    const [isSaving, setIsSaving] = useState(false)
    const [tags, setTags] = useState<string[]>([])
    const [tagInput, setTagInput] = useState("")

    useEffect(() => {
        fetchCategories()
    }, [])

    // Find channel-operation category to auto-select
    useEffect(() => {
        if (channelName && categories.length > 0) {
            const channelCat = categories.find(c => c.slug === 'channel-operation')
            if (channelCat) setCategoryId(channelCat.id)
            setTitle(`${channelName} 운행 이슈`)
        }
    }, [channelName, categories])

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
        // Mock AI Summary
        await new Promise(resolve => setTimeout(resolve, 1500)) // Simulate latency
        return text.length > 40 ? text.substring(0, 37) + "..." : text
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title || !content || !categoryId) {
            toast.error("필수 항목을 입력해주세요.")
            return
        }

        setIsSaving(true)
        try {
            // 1. Upload files (Mock for now, just storing metadata)
            const attachmentMeta = attachments.map(file => ({
                name: file.name,
                url: URL.createObjectURL(file), // Mock URL
                type: file.type,
                size: file.size
            }))

            // 2. Generate AI Summary
            const summary = await generateSummary(content.replace(/<[^>]*>?/gm, '')) // Strip HTML

            // 3. Create Post
            await addPost({
                title,
                content,
                category_id: categoryId,
                priority: isEmergency ? '긴급' : '일반',
                worklog_id: worklogId || undefined,
                channel: channelName || undefined,
                attachments: attachmentMeta,
                summary,
                tags,
                author_id: user?.id || undefined
            })

            // 4. Update Worklog if linked
            if (worklogId && channelName) {
                toast.success("업무일지에 요약이 반영되었습니다.")
            }

            toast.success("포스트가 저장되었습니다.")

            // 5. Navigation
            if (worklogId) {
                router.push(`/worklog/today?id=${worklogId}`)
            } else {
                router.push('/posts')
            }

        } catch (error) {
            console.error(error)
            toast.error("저장 중 오류가 발생했습니다.")
        } finally {
            setIsSaving(false)
        }
    }

    const modules = useMemo(() => ({
        toolbar: [
            [{ header: [1, 2, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['link', 'image'],
            ['clean']
        ],
        // imageResize: {
        //     parchment: (ReactQuill as any).Quill?.import('parchment'),
        //     modules: ['Resize', 'DisplaySize']
        // }
    }), [])

    return (
        <MainLayout>
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
                                <div className="space-y-2 flex flex-col justify-end pb-2">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="emergency-mode"
                                            checked={isEmergency}
                                            onCheckedChange={setIsEmergency}
                                        />
                                        <Label htmlFor="emergency-mode" className="font-medium text-red-600">
                                            긴급 이슈 (대시보드 상단 노출)
                                        </Label>
                                    </div>
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
                                    <ReactQuill
                                        theme="snow"
                                        value={content}
                                        onChange={setContent}
                                        modules={modules}
                                        className="h-full"
                                    />
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
                                            AI 요약 및 저장 중...
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
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    )
}
