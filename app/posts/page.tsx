import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, MessageSquare, Eye, ThumbsUp } from "lucide-react"

export default function PostList() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">통합 포스트</h1>
            <p className="text-muted-foreground">업무 관련 공지 및 이슈 공유 게시판입니다.</p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />새 포스트 작성
          </Button>
        </div>

        <div className="flex gap-4">
          <div className="w-64 shrink-0 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">카테고리</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {["전체보기", "공지사항", "장비이슈", "운행일지", "인수인계", "자유게시판"].map((category) => (
                  <Button key={category} variant="ghost" className="w-full justify-start">
                    {category}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="포스트 검색..." className="pl-8" />
              </div>
            </div>

            <div className="space-y-4">
              {[
                {
                  title: "11월 20일 주간 업무 인수인계",
                  author: "김주조",
                  category: "인수인계",
                  date: "2025-11-20 18:50",
                  views: 12,
                  comments: 2,
                  likes: 5,
                  preview: "금일 주간 특이사항 없습니다. MBC SPORTS+ 14:00 중계 관련...",
                },
                {
                  title: "APC 서버 정기 점검 안내",
                  author: "관리자",
                  category: "공지사항",
                  date: "2025-11-20 09:00",
                  views: 45,
                  comments: 0,
                  likes: 12,
                  preview: "내일 새벽 02:00부터 04:00까지 APC 서버 정기 점검이 예정되어 있습니다.",
                },
                {
                  title: "MBC Every1 송출 오류 보고",
                  author: "이영상",
                  category: "장비이슈",
                  date: "2025-11-19 15:30",
                  views: 28,
                  comments: 5,
                  likes: 3,
                  preview: "15:20경 화면 끊김 현상 발생하여 예비 장비로 절체하였습니다.",
                },
              ].map((post, i) => (
                <Card key={i} className="hover:bg-muted/50 transition-colors cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{post.category}</Badge>
                          <h3 className="font-semibold text-lg">{post.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">{post.preview}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mt-4">
                      <div className="flex items-center gap-4">
                        <span>{post.author}</span>
                        <span>{post.date}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{post.views}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>{post.comments}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <ThumbsUp className="h-4 w-4" />
                          <span>{post.likes}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
