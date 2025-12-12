"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, MessageSquare, Eye, ThumbsUp, AlertCircle, CheckCircle, Tag, X, ArrowUpDown, ArrowUp, ArrowDown, Share2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useRouter } from "next/navigation"
import { usePostStore, Post } from "@/store/posts"
import { format } from "date-fns"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useAuthStore } from "@/store/auth"
import { SimplePagination, usePagination } from "@/components/ui/simple-pagination"

export default function PostList() {
  const router = useRouter()
  const { posts, categories, loading, fetchCategories, fetchPosts, resolvePost, updatePost } = usePostStore()
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [resolveDialog, setResolveDialog] = useState<{ open: boolean, post: Post | null }>({ open: false, post: null })
  const [resolutionNote, setResolutionNote] = useState("")
  const { user } = useAuthStore()
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [hideResolved, setHideResolved] = useState(false)
  const [showMyPosts, setShowMyPosts] = useState(false)

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 15

  // Sort State
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' })

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
    setCurrentPage(1)
  }, [selectedCategory, searchQuery, selectedTag])

  // Reset pagination
  useEffect(() => {
    setCurrentPage(1)
  }, [priorityFilter, hideResolved, showMyPosts])

  const handleShare = (postId: string) => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/posts/${postId}`
      navigator.clipboard.writeText(url)
      toast.success("링크가 클립보드에 복사되었습니다.")
    }
  }

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }))
  }

  const filteredPosts = posts.filter(post => {
    if (priorityFilter !== "all" && post.priority !== priorityFilter) return false
    if (hideResolved && post.status === 'resolved') return false
    if (showMyPosts && user && post.author_id !== user.id) return false
    return true
  })

  // Sorting
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    const { key, direction } = sortConfig
    let aValue: any = a
    let bValue: any = b

    if (key === 'category.name') {
      aValue = a.category?.name || ''
      bValue = b.category?.name || ''
    } else if (key === 'worklog.work_date') {
      aValue = a.worklog?.work_date || ''
      bValue = b.worklog?.work_date || ''
    } else if (key === 'author.name') {
      aValue = a.author?.name || ''
      bValue = b.author?.name || ''
    } else if (key === 'priority') {
      const priorityOrder = { '긴급': 3, '중요': 2, '일반': 1 }
      aValue = priorityOrder[a.priority as keyof typeof priorityOrder] || 0
      bValue = priorityOrder[b.priority as keyof typeof priorityOrder] || 0
    } else if (key === 'comments') {
      aValue = a.comments?.[0]?.count || 0
      bValue = b.comments?.[0]?.count || 0
    } else {
      aValue = a[key as keyof Post]
    }

    if (aValue < bValue) return direction === 'asc' ? -1 : 1
    if (aValue > bValue) return direction === 'asc' ? 1 : -1
    return 0
  })

  const { totalPages, getPageItems } = usePagination(sortedPosts, ITEMS_PER_PAGE)
  const currentPosts = getPageItems(currentPage)

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

  const handlePriorityChange = async (postId: string, newPriority: '일반' | '중요' | '긴급') => {
    try {
      await updatePost(postId, { priority: newPriority })
      toast.success("우선순위가 변경되었습니다.")
    } catch (error) {
      toast.error("우선순위 변경 중 오류가 발생했습니다.")
    }
  }

  const renderSortIcon = (key: string) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
    }
    return <ArrowUpDown className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case '긴급': return <Badge variant="destructive" className="animate-pulse">긴급</Badge>
      case '중요': return <Badge className="bg-orange-500 hover:bg-orange-600">중요</Badge>
      default: return <Badge variant="secondary">일반</Badge>
    }
  }

  const getCategoryColor = (slug: string) => {
    if (slug === 'emergency') return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
    if (slug === 'notice') return "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
    if (slug === 'system-issue') return "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800"
    return "text-muted-foreground bg-muted border-border"
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-1 items-center gap-4 flex-wrap">
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="검색..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue placeholder="우선순위" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">전체</SelectItem>
                    <SelectItem value="긴급">긴급</SelectItem>
                    <SelectItem value="중요">중요</SelectItem>
                    <SelectItem value="일반">일반</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="hide-resolved"
                    checked={hideResolved}
                    onCheckedChange={setHideResolved}
                  />
                  <Label htmlFor="hide-resolved" className="text-sm font-medium cursor-pointer">해결됨 숨기기</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="my-posts"
                    checked={showMyPosts}
                    onCheckedChange={setShowMyPosts}
                  />
                  <Label htmlFor="my-posts" className="text-sm font-medium cursor-pointer">내 포스트</Label>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={cn("w-[150px] text-center cursor-pointer select-none transition-colors hover:text-primary hover:bg-muted/50 group", sortConfig.key === 'created_at' && "text-primary font-bold bg-muted/30")} onClick={() => handleSort('created_at')}>
                    <div className="flex items-center justify-center">날짜 {renderSortIcon('created_at')}</div>
                  </TableHead>
                  <TableHead className={cn("w-[100px] text-center cursor-pointer select-none transition-colors hover:text-primary hover:bg-muted/50 group", sortConfig.key === 'category.name' && "text-primary font-bold bg-muted/30")} onClick={() => handleSort('category.name')}>
                    <div className="flex items-center justify-center">카테고리 {renderSortIcon('category.name')}</div>
                  </TableHead>
                  <TableHead className={cn("w-[100px] text-center cursor-pointer select-none transition-colors hover:text-primary hover:bg-muted/50 group", sortConfig.key === 'priority' && "text-primary font-bold bg-muted/30")} onClick={() => handleSort('priority')}>
                    <div className="flex items-center justify-center">우선순위 {renderSortIcon('priority')}</div>
                  </TableHead>
                  <TableHead className={cn("cursor-pointer select-none transition-colors hover:text-primary hover:bg-muted/50 group", sortConfig.key === 'title' && "text-primary font-bold bg-muted/30")} onClick={() => handleSort('title')}>
                    <div className="flex items-center">제목 {renderSortIcon('title')}</div>
                  </TableHead>
                  <TableHead className={cn("w-[120px] text-center cursor-pointer select-none transition-colors hover:text-primary hover:bg-muted/50 group", sortConfig.key === 'worklog.work_date' && "text-primary font-bold bg-muted/30")} onClick={() => handleSort('worklog.work_date')}>
                    <div className="flex items-center justify-center">업무일지 {renderSortIcon('worklog.work_date')}</div>
                  </TableHead>
                  <TableHead className={cn("w-[100px] text-center cursor-pointer select-none transition-colors hover:text-primary hover:bg-muted/50 group", sortConfig.key === 'author.name' && "text-primary font-bold bg-muted/30")} onClick={() => handleSort('author.name')}>
                    <div className="flex items-center justify-center">작성자 {renderSortIcon('author.name')}</div>
                  </TableHead>
                  <TableHead className={cn("w-[80px] text-center cursor-pointer select-none transition-colors hover:text-primary hover:bg-muted/50 group", sortConfig.key === 'views' && "text-primary font-bold bg-muted/30")} onClick={() => handleSort('views')}>
                    <div className="flex items-center justify-center">조회 {renderSortIcon('views')}</div>
                  </TableHead>
                  <TableHead className={cn("w-[80px] text-center cursor-pointer select-none transition-colors hover:text-primary hover:bg-muted/50 group", sortConfig.key === 'comments' && "text-primary font-bold bg-muted/30")} onClick={() => handleSort('comments')}>
                    <div className="flex items-center justify-center">댓글 {renderSortIcon('comments')}</div>
                  </TableHead>
                  <TableHead className="w-[100px] text-center">상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10">로딩 중...</TableCell>
                  </TableRow>
                ) : sortedPosts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">등록된 포스트가 없습니다.</TableCell>
                  </TableRow>
                ) : (
                  currentPosts.map((post) => (
                    <TableRow
                      key={post.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => router.push(`/posts/${post.id}`)}
                    >
                      <TableCell className="text-center text-sm text-muted-foreground">
                        <span suppressHydrationWarning>
                          {format(new Date(post.created_at), "yyyy-MM-dd HH:mm")}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={getCategoryColor(post.category?.slug || "")}>
                          {post.category?.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger className="outline-none">
                            {getPriorityBadge(post.priority)}
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleShare(post.id)}>
                              <Share2 className="mr-2 h-4 w-4" />
                              링크 복사
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePriorityChange(post.id, '긴급')}>
                              <Badge variant="destructive" className="mr-2">긴급</Badge> 긴급
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePriorityChange(post.id, '중요')}>
                              <Badge className="bg-orange-500 mr-2">중요</Badge> 중요
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePriorityChange(post.id, '일반')}>
                              <Badge variant="secondary" className="mr-2">일반</Badge> 일반
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
                      <TableCell className="text-center text-sm">
                        {post.worklog ? (
                          <div
                            className="flex flex-col items-center cursor-pointer hover:bg-muted rounded p-1 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/worklog?id=${post.worklog?.id}`)
                            }}
                          >
                            <span className="font-medium" suppressHydrationWarning>
                              {post.worklog.work_date ? format(new Date(post.worklog.work_date), "MM-dd") : '-'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {post.worklog.group?.name} {post.worklog.type === '주간' ? 'A' : 'N'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {post.author?.name ? (
                          post.author.name
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <Badge variant="secondary" className="h-5 px-1 text-[10px]">GROUP</Badge>
                            <span>
                              {post.worklog?.group?.name || '-'}
                              {post.creator?.name && <span className="text-xs text-muted-foreground ml-1">({post.creator.name})</span>}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        <div className="flex items-center justify-center gap-1">
                          <Eye className="h-3 w-3" /> {post.views}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        <div className="flex items-center justify-center gap-1">
                          <MessageSquare className="h-3 w-3" /> {post.comments?.[0]?.count || 0}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {post.priority === '긴급' && post.status === 'open' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-700 dark:hover:text-red-300"
                            onClick={(e) => handleResolveClick(post, e)}
                          >
                            <AlertCircle className="mr-1 h-3 w-3" />
                            해결
                          </Button>
                        ) : post.status === 'resolved' ? (
                          <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            해결됨
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow >
                  ))
                )}
              </TableBody >
            </Table >
          </CardContent >
        </Card >

        <SimplePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />

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
      </div >
    </MainLayout >
  )
}
