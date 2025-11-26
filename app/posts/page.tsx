"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, MessageSquare, Eye, ThumbsUp, AlertCircle, CheckCircle, Tag, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useRouter } from "next/navigation"
import { usePostStore, Post } from "@/store/posts"
import { format } from "date-fns"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

export default function PostList() {
  const router = useRouter()
  const { posts, categories, loading, fetchCategories, fetchPosts, resolvePost } = usePostStore()
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [resolveDialog, setResolveDialog] = useState<{ open: boolean, post: Post | null }>({ open: false, post: null })
  const [resolutionNote, setResolutionNote] = useState("")

  useEffect(() => {
    fetchCategories()
    fetchPosts()
  }, [])

  useEffect(() => {
    fetchPosts({
      categoryId: selectedCategory === "all" ? undefined : selectedCategory,
      search: searchQuery,
      tag: selectedTag || undefined
    })
  }, [selectedCategory, searchQuery, selectedTag])

  const handleResolveClick = (post: Post, e: React.MouseEvent) => {
    e.stopPropagation()
    setResolveDialog({ open: true, post })
  }

  const handleTagClick = (tag: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedTag(tag)
  }

  const clearTagFilter = () => {
    setSelectedTag(null)
  }

  const confirmResolve = async () => {
    if (!resolveDialog.post) return
    try {
      await resolvePost(resolveDialog.post.id, resolutionNote)
      toast.success("이슈가 해결 처리되었습니다.")
      setResolveDialog({ open: false, post: null })
      setResolutionNote("")
    } catch (error) {
      toast.error("처리 중 오류가 발생했습니다.")
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case '긴급': return <Badge variant="destructive" className="animate-pulse">긴급</Badge>
      case '중요': return <Badge className="bg-orange-500 hover:bg-orange-600">중요</Badge>
      default: return <Badge variant="secondary">일반</Badge>
    }
  }

  const getCategoryColor = (slug: string) => {
    // Simple color mapping based on slug
    if (slug === 'emergency') return "text-red-600 bg-red-50 border-red-200"
    if (slug === 'notice') return "text-blue-600 bg-blue-50 border-blue-200"
    if (slug === 'system-issue') return "text-orange-600 bg-orange-50 border-orange-200"
    return "text-slate-600 bg-slate-50 border-slate-200"
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">통합 포스트</h1>
            <p className="text-muted-foreground">업무 관련 공지 및 이슈 공유 게시판입니다.</p>
          </div>
          <Button onClick={() => router.push('/posts/new')}>
            <Plus className="mr-2 h-4 w-4" />새 포스트 작성
          </Button>
        </div>

        {/* Categories & Tag Filter */}
        <div className="flex flex-col gap-4">
          <ScrollArea className="w-full whitespace-nowrap rounded-md border">
            <div className="flex w-max space-x-2 p-4">
              <Button
                variant={selectedCategory === "all" ? "default" : "ghost"}
                onClick={() => setSelectedCategory("all")}
                className="rounded-full"
              >
                전체보기
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "ghost"}
                  onClick={() => setSelectedCategory(category.id)}
                  className="rounded-full"
                >
                  {category.name}
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {selectedTag && (
            <div className="flex items-center gap-2 px-1">
              <span className="text-sm text-muted-foreground">선택된 태그:</span>
              <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1 text-sm">
                #{selectedTag}
                <button onClick={clearTagFilter} className="ml-1 hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            </div>
          )}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>포스트 목록</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="검색..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px] text-center">카테고리</TableHead>
                  <TableHead className="w-[100px] text-center">우선순위</TableHead>
                  <TableHead>제목</TableHead>
                  <TableHead className="w-[100px] text-center">작성자</TableHead>
                  <TableHead className="w-[150px] text-center">날짜</TableHead>
                  <TableHead className="w-[80px] text-center">조회</TableHead>
                  <TableHead className="w-[80px] text-center">좋아요</TableHead>
                  <TableHead className="w-[100px] text-center">상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      로딩 중...
                    </TableCell>
                  </TableRow>
                ) : posts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      등록된 포스트가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  posts.map((post) => (
                    <TableRow
                      key={post.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => router.push(`/posts/${post.id}`)}
                    >
                      <TableCell className="text-center">
                        <Badge variant="outline" className={getCategoryColor(post.category?.slug || "")}>
                          {post.category?.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {getPriorityBadge(post.priority)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="font-medium hover:underline block truncate max-w-[400px]">
                                  {post.title}
                                </span>
                              </TooltipTrigger>
                              {post.summary && (
                                <TooltipContent>
                                  <p className="max-w-xs text-sm">{post.summary}</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TooltipProvider>
                          {post.tags && post.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {post.tags.map(tag => (
                                <span
                                  key={tag}
                                  className="text-xs text-muted-foreground hover:text-primary bg-muted/50 px-1.5 py-0.5 rounded-sm cursor-pointer transition-colors"
                                  onClick={(e) => handleTagClick(tag, e)}
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm">{post.author?.name}</TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {format(new Date(post.created_at), "yyyy-MM-dd HH:mm")}
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        <div className="flex items-center justify-center gap-1">
                          <Eye className="h-3 w-3" /> {post.views}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        <div className="flex items-center justify-center gap-1">
                          <ThumbsUp className="h-3 w-3" /> {post.likes}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {post.priority === '긴급' && post.status === 'open' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={(e) => handleResolveClick(post, e)}
                          >
                            <AlertCircle className="mr-1 h-3 w-3" />
                            해결
                          </Button>
                        ) : post.status === 'resolved' ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            해결됨
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Resolve Dialog */}
        <Dialog open={resolveDialog.open} onOpenChange={(open) => setResolveDialog({ ...resolveDialog, open })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>이슈 해결 처리</DialogTitle>
              <DialogDescription>
                해당 긴급 이슈를 해결 상태로 변경합니다. 조치 내용을 간단히 입력해주세요.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">이슈 제목</h4>
                <p className="text-sm text-muted-foreground p-2 bg-muted rounded-md">
                  {resolveDialog.post?.title}
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-sm">조치 내용</h4>
                <Textarea
                  placeholder="예: 장비 재부팅 후 정상화 확인됨"
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResolveDialog({ open: false, post: null })}>취소</Button>
              <Button onClick={confirmResolve} disabled={!resolutionNote.trim()}>
                해결 완료
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
