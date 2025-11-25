"use client"

import { useEffect, useState } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Search, MoreHorizontal, Trash2, Edit } from "lucide-react"
import { Input } from "@/components/ui/input"
import { supabase } from "@/lib/supabase"
import { WorkerRegistrationDialog } from "@/components/worker-registration-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { toast } from "sonner"

interface Worker {
  id: string
  name: string
  email: string
  role: string
  team: string
  status: string
  lastLogin: string
  type: 'internal' | 'external'
  profile_image_url?: string
}

export default function UsersPage() {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortConfig, setSortConfig] = useState<{ key: keyof Worker; direction: "asc" | "desc" } | null>(null)

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState<Worker | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  // Edit State
  const [editTarget, setEditTarget] = useState<Worker | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)

  useEffect(() => {
    fetchWorkers()
  }, [])

  const fetchWorkers = async () => {
    // ... (fetch logic remains same)
    try {
      setLoading(true)

      // 1. Fetch Internal Users
      const { data: internalData, error: internalError } = await supabase
        .from('users')
        .select('*')
        .order('name')

      if (internalError) throw internalError

      // 2. Fetch Group Memberships (to link users to groups)
      const { data: membershipData, error: membershipError } = await supabase
        .from('group_members')
        .select(`
          user_id,
          groups (name)
        `)

      if (membershipError) throw membershipError

      // Create a map of user_id -> group_name
      const userGroupMap: Record<string, string> = {}
      if (membershipData) {
        membershipData.forEach((m: any) => {
          if (m.user_id && m.groups?.name) {
            userGroupMap[m.user_id] = m.groups.name
          }
        })
      }

      // 3. Fetch External Staff
      const { data: externalData, error: externalError } = await supabase
        .from('external_staff')
        .select('*')
        .order('name')

      if (externalError) throw externalError

      // 4. Transform and Combine
      const internalWorkers: Worker[] = (internalData || []).map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        team: userGroupMap[u.id] || "소속 없음",
        status: u.is_active ? "active" : "inactive",
        lastLogin: "-",
        type: 'internal',
        profile_image_url: u.profile_image_url
      }))

      const externalWorkers: Worker[] = (externalData || []).map((e: any) => ({
        id: e.id,
        name: e.name,
        email: e.email || "-",
        role: e.role,
        team: e.organization || "외부",
        status: e.is_active ? "active" : "inactive",
        lastLogin: "-",
        type: 'external'
      }))

      setWorkers([...internalWorkers, ...externalWorkers])

    } catch (error) {
      console.error("Error fetching workers:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (key: keyof Worker) => {
    // ... (sort logic remains same)
    let direction: "asc" | "desc" = "asc"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const confirmDelete = (worker: Worker) => {
    setDeleteTarget(worker)
    setIsDeleteOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      if (deleteTarget.type === 'internal') {
        // Delete internal user (from users table - cascade should handle group_members)
        // Note: We are NOT deleting from auth.users via API here as it requires service role key or admin API.
        // We are just removing from public.users which effectively "deletes" them from the app view.
        const { error } = await supabase
          .from('users')
          .delete()
          .eq('id', deleteTarget.id)

        if (error) throw error
      } else {
        // Delete external staff
        const { error } = await supabase
          .from('external_staff')
          .delete()
          .eq('id', deleteTarget.id)

        if (error) throw error
      }

      toast.success(`${deleteTarget.name} 근무자가 삭제되었습니다.`)
      fetchWorkers()
    } catch (error: any) {
      toast.error("삭제 실패: " + error.message)
    } finally {
      setIsDeleteOpen(false)
      setDeleteTarget(null)
    }
  }

  const handleEdit = (worker: Worker) => {
    setEditTarget(worker)
    setIsEditOpen(true)
  }

  const handleEditSuccess = () => {
    fetchWorkers()
    setIsEditOpen(false)
    setEditTarget(null)
  }

  const filteredWorkers = workers.filter(worker =>
    worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    worker.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    worker.team.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const sortedWorkers = [...filteredWorkers].sort((a, b) => {
    // ... (sort logic remains same)
    if (!sortConfig) return 0

    const aValue = a[sortConfig.key] || ""
    const bValue = b[sortConfig.key] || ""

    if (aValue < bValue) {
      return sortConfig.direction === "asc" ? -1 : 1
    }
    if (aValue > bValue) {
      return sortConfig.direction === "asc" ? 1 : -1
    }
    return 0
  })

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">근무자 관리</h1>
            <p className="text-muted-foreground">시스템 근무자 및 권한을 관리합니다.</p>
          </div>
          <WorkerRegistrationDialog onSuccess={fetchWorkers} />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>근무자 목록 ({sortedWorkers.length}명)</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="이름, 이메일, 소속 검색..."
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
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("name")}>근무자</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("role")}>역할</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("team")}>소속</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("status")}>상태</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleSort("type")}>유형</TableHead>
                  <TableHead className="text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      데이터를 불러오는 중입니다...
                    </TableCell>
                  </TableRow>
                ) : sortedWorkers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      검색 결과가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedWorkers.map((worker) => (
                    <TableRow key={worker.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={worker.profile_image_url} />
                            <AvatarFallback>{worker.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{worker.name}</p>
                            <p className="text-xs text-muted-foreground">{worker.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {worker.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{worker.team}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2 w-2 rounded-full ${worker.status === "active" ? "bg-green-500" : "bg-gray-300"}`}
                          />
                          <span className="text-sm">{worker.status === "active" ? "활성" : "비활성"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={worker.type === 'internal' ? 'secondary' : 'default'}>
                          {worker.type === 'internal' ? '사내' : '외부'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(worker)}>
                              <Edit className="mr-2 h-4 w-4" />
                              수정
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => confirmDelete(worker)} className="text-red-600">
                              <Trash2 className="mr-2 h-4 w-4" />
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>근무자 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 <strong>{deleteTarget?.name}</strong> 근무자를 삭제하시겠습니까?
              <br />
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Dialog */}
      <WorkerRegistrationDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        workerToEdit={editTarget}
        onSuccess={handleEditSuccess}
      />
    </MainLayout>
  )
}
