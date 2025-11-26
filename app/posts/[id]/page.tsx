"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Calendar, User, Eye, Paperclip, Download, AlertTriangle } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { usePostStore, Post } from "@/store/posts"
import { toast } from "sonner"

export default function PostDetailPage() {
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    const { posts, fetchPosts } = usePostStore()
    const [post, setPost] = useState<Post | null>(null)

    useEffect(() => {
        // If posts are already loaded, find it
        const existingPost = posts.find(p => p.id === id)
        if (existingPost) {
            setPost(existingPost)
        } else {
            // Otherwise fetch (in a real app we might fetch single post)
            fetchPosts().then(() => {
                const found = usePostStore.getState().posts.find(p => p.id === id)
                if (found) setPost(found)
            })
        }
    }, [id, posts, fetchPosts])

    if (!post) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-[50vh]">
                    <p className="text-muted-foreground">로딩 중...</p>
                </div>
            </MainLayout>
        )
    }

    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-2xl font-bold">포스트 상세</h1>
                </div>

                <Card>
                    <CardHeader className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline">{post.category?.name || '카테고리 없음'}</Badge>
                                {post.priority === '긴급' && (
                                    <Badge variant="destructive" className="animate-pulse">긴급</Badge>
                                )}
                                {post.priority === '중요' && (
                                    <Badge className="bg-orange-500 hover:bg-orange-600">중요</Badge>
                                )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Eye className="h-4 w-4" />
                                    <span>{post.views}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                        <CardTitle className="text-2xl">{post.title}</CardTitle>
                        {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {post.tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">
                                        #{tag}
                                    </Badge>
                                ))}
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground border-b pb-4 pt-2">
                            <User className="h-4 w-4" />
                            <span>{post.author?.name || '작성자 미상'}</span>
                            {post.channel && (
                                <>
                                    <span className="mx-1">|</span>
                                    <span>관련 채널: {post.channel}</span>
                                </>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        {/* AI Summary Section */}
                        {post.summary && (
                            <div className="bg-muted/50 p-4 rounded-lg border border-blue-100">
                                <h3 className="text-sm font-bold text-blue-600 mb-2 flex items-center gap-2">
                                    <span className="bg-blue-100 p-1 rounded">AI</span>
                                    요약
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {post.summary}
                                </p>
                            </div>
                        )}

                        {/* Main Content */}
                        <div
                            className="prose prose-sm max-w-none dark:prose-invert min-h-[200px]"
                            dangerouslySetInnerHTML={{ __html: post.content }}
                        />

                        {/* Attachments */}
                        {post.attachments && post.attachments.length > 0 && (
                            <div className="border-t pt-6">
                                <h3 className="font-medium mb-3 flex items-center gap-2">
                                    <Paperclip className="h-4 w-4" />
                                    첨부파일 ({post.attachments.length})
                                </h3>
                                <div className="grid gap-2 md:grid-cols-2">
                                    {post.attachments.map((file: any, index: number) => (
                                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="bg-muted p-2 rounded">
                                                    <FileIcon type={file.type} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">{file.name}</p>
                                                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" asChild>
                                                <a href={file.url} download target="_blank" rel="noopener noreferrer">
                                                    <Download className="h-4 w-4" />
                                                </a>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    )
}

function FileIcon({ type }: { type: string }) {
    if (type.startsWith('image/')) return <span className="text-xs font-bold">IMG</span>
    if (type.includes('pdf')) return <span className="text-xs font-bold">PDF</span>
    return <span className="text-xs font-bold">FILE</span>
}

function formatFileSize(bytes: number) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
