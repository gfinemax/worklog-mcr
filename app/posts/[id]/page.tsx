"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Calendar, User, Eye, Paperclip, Download, AlertTriangle, MessageSquare, Trash2, Loader2, Smile, Edit2, CornerDownRight } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { usePostStore, Post, Comment } from "@/store/posts"
import { useAuthStore } from "@/store/auth"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"

export default function PostDetailPage() {
    const router = useRouter()
    const params = useParams()
    const id = params.id as string

    const { posts, fetchPosts, fetchComments, addComment, deleteComment, updateComment, deletePost } = usePostStore()
    const { user } = useAuthStore()
    const [post, setPost] = useState<Post | null>(null)
    const [comments, setComments] = useState<Comment[]>([])
    const [newComment, setNewComment] = useState("")
    const [isSubmittingComment, setIsSubmittingComment] = useState(false)

    const handleDeletePost = async () => {
        if (!confirm("정말로 이 포스트를 삭제하시겠습니까?")) return

        try {
            await deletePost(id)
            toast.success("포스트가 삭제되었습니다.")
            router.push('/posts')
        } catch (error) {
            toast.error("포스트 삭제 중 오류가 발생했습니다.")
        }
    }

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

        // Fetch comments
        loadComments()
    }, [id, posts, fetchPosts])

    const loadComments = async () => {
        const data = await fetchComments(id)
        setComments(data)
    }

    const handleSubmitComment = async () => {
        if (!newComment.trim() || !user) return

        setIsSubmittingComment(true)
        try {
            const activeId = useAuthStore.getState().activeMemberId
            const authorId = (activeId && activeId !== "GROUP_COMMON") ? activeId : user.id

            await addComment({
                post_id: id,
                author_id: authorId,
                content: newComment
            })
            setNewComment("")
            toast.success("댓글이 등록되었습니다.")
            loadComments()
        } catch (error) {
            toast.error("댓글 등록 중 오류가 발생했습니다.")
        } finally {
            setIsSubmittingComment(false)
        }
    }

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm("댓글을 삭제하시겠습니까?")) return

        try {
            await deleteComment(commentId)
            toast.success("댓글이 삭제되었습니다.")
            loadComments()
        } catch (error) {
            toast.error("댓글 삭제 중 오류가 발생했습니다.")
        }
    }

    const handleUpdateComment = async (commentId: string, content: string) => {
        try {
            await updateComment(commentId, { content, updated_at: new Date().toISOString() })
            toast.success("댓글이 수정되었습니다.")
            loadComments()
        } catch (error) {
            toast.error("댓글 수정 중 오류가 발생했습니다.")
        }
    }

    const handleReplyComment = async (parentId: string, content: string) => {
        if (!user) return
        try {
            const activeId = useAuthStore.getState().activeMemberId
            const authorId = (activeId && activeId !== "GROUP_COMMON") ? activeId : user.id
            await addComment({
                post_id: id,
                author_id: authorId,
                content,
                parent_id: parentId
            })
            toast.success("답글이 등록되었습니다.")
            loadComments()
        } catch (error) {
            toast.error("답글 등록 중 오류가 발생했습니다.")
        }
    }

    const handleReaction = async (commentId: string, emoji: string) => {
        if (!user) return
        const comment = comments.find(c => c.id === commentId)
        if (!comment) return

        const activeId = useAuthStore.getState().activeMemberId
        const currentUserId = (activeId && activeId !== "GROUP_COMMON") ? activeId : user.id
        const currentReactions = comment.reactions || {}
        const userIds = currentReactions[emoji] || []

        let newReactions = { ...currentReactions }

        if (userIds.includes(currentUserId)) {
            // Remove reaction
            newReactions[emoji] = userIds.filter(uid => uid !== currentUserId)
            if (newReactions[emoji].length === 0) {
                delete newReactions[emoji]
            }
        } else {
            // Add reaction
            newReactions[emoji] = [...userIds, currentUserId]
        }

        try {
            await updateComment(commentId, { reactions: newReactions })
            // Optimistic update
            setComments(comments.map(c => c.id === commentId ? { ...c, reactions: newReactions } : c))
        } catch (error) {
            toast.error("반응 업데이트 실패")
            loadComments() // Revert on error
        }
    }

    if (!post) {
        return (
            <MainLayout>
                <div className="flex items-center justify-center h-[50vh]">
                    <p className="text-muted-foreground">로딩 중...</p>
                </div>
            </MainLayout>
        )
    }

    // Group comments by parent_id
    const rootComments = comments.filter(c => !c.parent_id)
    const getReplies = (parentId: string) => comments.filter(c => c.parent_id === parentId)

    return (
        <MainLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-2xl font-bold">포스트 상세</h1>
                    </div>
                    {user && (
                        (post.author_id === user.id) ||
                        (post.created_by === user.id) ||
                        (useAuthStore.getState().activeMemberId && post.created_by === useAuthStore.getState().activeMemberId) ||
                        (post.worklog?.group?.id === user.id)
                    ) && (
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => router.push(`/posts/${id}/edit`)}>
                                    <Edit2 className="mr-2 h-4 w-4" />
                                    수정
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleDeletePost} className="text-destructive hover:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    삭제
                                </Button>
                            </div>
                        )}
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
                            {post.author?.name ? (
                                <span>{post.author.name}</span>
                            ) : (
                                <div className="flex items-center gap-1">
                                    <Badge variant="secondary" className="h-5 px-1 text-[10px] bg-slate-100 text-slate-600">GROUP</Badge>
                                    <span>
                                        {post.worklog?.group?.name || '작성자 미상'}
                                        {post.creator?.name && <span className="text-xs text-muted-foreground ml-1">({post.creator.name})</span>}
                                    </span>
                                </div>
                            )}
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
                        <style jsx global>{`
                            /* Ensure inline styles for alignment take precedence over Prose defaults */
                            .prose img {
                                margin-top: 1em;
                                margin-bottom: 1em;
                            }
                            
                            /* Support for Quill Blot Formatter inline styles - permissive matching */
                            .prose img[style*="display: block"] {
                                display: block !important;
                            }
                            
                            /* Handle margin auto variations */
                            .prose img[style*="margin: auto"],
                            .prose img[style*="margin:auto"],
                            .prose img[style*="margin: 0 auto"],
                            .prose img[style*="margin:0 auto"] {
                                margin-left: auto !important;
                                margin-right: auto !important;
                                display: block !important; /* Force block if margin auto is present */
                            }
                            
                            /* Support for standard Quill alignment classes */
                            .ql-align-center {
                                text-align: center;
                            }
                            .ql-align-right {
                                text-align: right;
                            }
                            .ql-align-justify {
                                text-align: justify;
                            }
                            
                            /* Ensure images inside centered containers are centered */
                            .ql-align-center img {
                                margin: 0 auto;
                                display: block;
                            }
                        `}</style>
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

                {/* Comments Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            댓글
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Comment List */}
                        <div className="space-y-6">
                            {rootComments.length === 0 ? (
                                <p className="text-center text-muted-foreground py-4">
                                    아직 작성된 댓글이 없습니다.
                                </p>
                            ) : (
                                rootComments.map((comment) => (
                                    <CommentItem
                                        key={comment.id}
                                        comment={comment}
                                        replies={getReplies(comment.id)}
                                        currentUserId={(useAuthStore.getState().activeMemberId && useAuthStore.getState().activeMemberId !== "GROUP_COMMON") ? useAuthStore.getState().activeMemberId! : user?.id}
                                        onDelete={handleDeleteComment}
                                        onUpdate={handleUpdateComment}
                                        onReply={handleReplyComment}
                                        onReaction={handleReaction}
                                    />
                                ))
                            )}
                        </div>

                        {/* Comment Form */}
                        <div className="flex gap-3 pt-4 border-t">
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                                <User className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 space-y-2">
                                <Textarea
                                    placeholder="댓글을 입력하세요..."
                                    className="min-h-[80px] resize-none"
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                />
                                <div className="flex justify-end">
                                    <Button
                                        size="sm"
                                        onClick={handleSubmitComment}
                                        disabled={!newComment.trim() || isSubmittingComment}
                                    >
                                        {isSubmittingComment ? (
                                            <>
                                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                                등록 중...
                                            </>
                                        ) : (
                                            "댓글 등록"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </MainLayout>
    )
}

interface CommentItemProps {
    comment: Comment
    replies: Comment[]
    currentUserId?: string
    onDelete: (id: string) => void
    onUpdate: (id: string, content: string) => void
    onReply: (parentId: string, content: string) => void
    onReaction: (id: string, emoji: string) => void
}

function CommentItem({ comment, replies, currentUserId, onDelete, onUpdate, onReply, onReaction }: CommentItemProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editContent, setEditContent] = useState(comment.content)
    const [isReplying, setIsReplying] = useState(false)
    const [replyContent, setReplyContent] = useState("")
    const [showEmojiPicker, setShowEmojiPicker] = useState(false)

    const handleSaveEdit = () => {
        if (editContent.trim() !== comment.content) {
            onUpdate(comment.id, editContent)
        }
        setIsEditing(false)
    }

    const handleSubmitReply = () => {
        if (replyContent.trim()) {
            onReply(comment.id, replyContent)
            setReplyContent("")
            setIsReplying(false)
        }
    }

    return (
        <div className="group">
            <div className="flex gap-3">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{comment.author?.name || '알 수 없음'}</span>
                            <span className="text-xs text-muted-foreground">
                                {new Date(comment.created_at).toLocaleString()}
                            </span>
                            {comment.updated_at && comment.updated_at !== comment.created_at && (
                                <span className="text-xs text-muted-foreground">(수정됨)</span>
                            )}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                                <Smile className="h-3 w-3 text-muted-foreground" />
                            </Button>
                            {currentUserId === comment.author_id && (
                                <>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsEditing(!isEditing)}>
                                        <Edit2 className="h-3 w-3 text-muted-foreground" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDelete(comment.id)}>
                                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {showEmojiPicker && (
                        <div className="absolute z-10 mt-1 bg-white dark:bg-slate-800 border rounded-full shadow-lg p-1 flex items-center gap-1 animate-in fade-in zoom-in-95 duration-200">
                            <div className="fixed inset-0 z-[-1]" onClick={() => setShowEmojiPicker(false)} />
                            {['❤️', '👍', '✅', '😄', '😢'].map(emoji => (
                                <button
                                    key={emoji}
                                    className="hover:bg-slate-100 dark:hover:bg-slate-700 p-2 rounded-full text-xl transition-transform hover:scale-125 leading-none"
                                    onClick={() => {
                                        onReaction(comment.id, emoji)
                                        setShowEmojiPicker(false)
                                    }}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}

                    {isEditing ? (
                        <div className="space-y-2 mt-2">
                            <Textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="min-h-[60px]"
                            />
                            <div className="flex justify-end gap-2">
                                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>취소</Button>
                                <Button size="sm" onClick={handleSaveEdit}>저장</Button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap">{comment.content}</p>
                    )}

                    {/* Reactions */}
                    {comment.reactions && Object.keys(comment.reactions).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(comment.reactions).map(([emoji, userIds]) => (
                                <Button
                                    key={emoji}
                                    variant="outline"
                                    size="sm"
                                    className={`h-6 px-2 text-xs gap-1 ${userIds.includes(currentUserId || '') ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : ''}`}
                                    onClick={() => onReaction(comment.id, emoji)}
                                >
                                    <span>{emoji}</span>
                                    <span>{userIds.length}</span>
                                </Button>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-4 mt-1">
                        <Button
                            variant="link"
                            size="sm"
                            className="h-auto p-0 text-xs text-muted-foreground"
                            onClick={() => setIsReplying(!isReplying)}
                        >
                            답글 달기
                        </Button>
                    </div>

                    {isReplying && (
                        <div className="flex gap-3 mt-3">
                            <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                                <CornerDownRight className="h-3 w-3 text-muted-foreground" />
                            </div>
                            <div className="flex-1 space-y-2">
                                <Textarea
                                    placeholder="답글을 입력하세요..."
                                    className="min-h-[60px] resize-none"
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                />
                                <div className="flex justify-end gap-2">
                                    <Button size="sm" variant="ghost" onClick={() => setIsReplying(false)}>취소</Button>
                                    <Button size="sm" onClick={handleSubmitReply}>등록</Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Nested Replies */}
            {replies.length > 0 && (
                <div className="pl-11 mt-3 space-y-3 border-l-2 ml-4">
                    {replies.map(reply => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            replies={[]} // Only support 1 level nesting for now
                            currentUserId={currentUserId}
                            onDelete={onDelete}
                            onUpdate={onUpdate}
                            onReply={onReply} // Recursion possible but limited by UI
                            onReaction={onReaction}
                        />
                    ))}
                </div>
            )}
        </div>
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
