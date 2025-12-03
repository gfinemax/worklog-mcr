"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, MoreHorizontal, Trash2, Edit } from "lucide-react"
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
    groupName: string
    status: string
    lastLogin: string
    type: 'internal' | 'external'
    profile_image_url?: string
}

const ROLE_PRIORITY: Record<string, number> = {
    "감독": 1,
    "부감독": 2,
    "영상": 3,
    "시스템관리": 4,
    "관리": 5,
    "기술스텝": 6,
    "조원": 7
}

const getRolePriorityValue = (roleString: string) => {
    if (!roleString) return 99
    const priorities = roleString.split(',').map(r => ROLE_PRIORITY[r.trim()] || 99)
    return Math.min(...priorities)
}

const sortRoles = (roleString: string) => {
    if (!roleString) return ""
    return roleString
        .split(',')
        .map(r => r.trim())
        .sort((a, b) => {
            const priorityA = ROLE_PRIORITY[a] || 99
            const priorityB = ROLE_PRIORITY[b] || 99
            return priorityA - priorityB
        })
        .join(', ')
}

import { useShiftWizardStore } from "@/store/shift-wizard-store"
import { Step2Roster } from "./shift-wizard/step-2-roster"
import { LiveRosterView } from "./live-roster-view"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function WorkerManagement() {
    const { isWizardActive, draftConfig, draftAssignments, updateDraftAssignments, setStep } = useShiftWizardStore()
    const [viewMode, setViewMode] = useState<'list' | 'team'>('list')

    // Normal Mode State (Moved up to fix Hook Order)
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

    const fetchWorkers = async () => {
        try {
            setLoading(true)

            // 1. Fetch All Users
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('*')
                .order('name')

            if (usersError) throw usersError

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

            // 3. Transform
            const allWorkers: Worker[] = (usersData || []).map((u: any) => {
                const type = u.type || 'internal'
                return {
                    id: u.id,
                    name: u.name,
                    email: u.email || "-",
                    role: sortRoles(u.role),
                    groupName: type === 'internal' ? (userGroupMap[u.id] || "소속 없음") : (u.organization || "지원"),
                    status: u.is_active ? "active" : "inactive",
                    lastLogin: "-",
                    type: type,
                    profile_image_url: u.profile_image_url
                }
            })

            setWorkers(allWorkers)

        } catch (error) {
            console.error("Error fetching workers:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!isWizardActive) {
            fetchWorkers()
        }
    }, [isWizardActive])

    const handleSort = (key: keyof Worker) => {
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
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', deleteTarget.id)

            if (error) throw error

            toast.success(`${deleteTarget.name} 근무자가 삭제되었습니다.`)
            fetchWorkers()
        } catch (error: any) {
            toast.error("삭제 실패: " + error.message)
        } finally {
            setIsDeleteOpen(false)
            setDeleteTarget(null)
        }
    }

    const handleToggleStatus = async (worker: Worker) => {
        try {
            const newStatus = worker.status === 'active' ? false : true
            const { error } = await supabase
                .from('users')
                .update({ is_active: newStatus })
                .eq('id', worker.id)

            if (error) throw error

            setWorkers(prev => prev.map(w =>
                w.id === worker.id
                    ? { ...w, status: newStatus ? 'active' : 'inactive' }
                    : w
            ))
            toast.success(`${worker.name} 님의 근무배치 상태가 변경되었습니다.`)
        } catch (error: any) {
            toast.error("상태 변경 실패: " + error.message)
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

    // Wizard Mode Logic
    if (isWizardActive) {
        // Convert draftAssignments (array) to Record<team, userIds>
        const assignmentsRecord: Record<string, string[]> = {}

        // Initialize with teams from config
        const teams = draftConfig?.shift_teams || []
        teams.forEach(t => assignmentsRecord[t] = [])
        assignmentsRecord['Unassigned'] = []

        // Populate from draftAssignments
        // Note: We need to handle the initial load where draftAssignments might be empty but we want to show all users as Unassigned
        // Step2Roster handles fetching users and initial population if assignments is empty.
        // But here we need to pass the current state.

        // If draftAssignments is empty, we pass empty record and let Step2Roster initialize?
        // Step2Roster logic: if (Object.keys(data.assignments).length === 0) -> initialize

        if (draftAssignments.length > 0) {
            draftAssignments.forEach(a => {
                if (!assignmentsRecord[a.team]) assignmentsRecord[a.team] = []
                assignmentsRecord[a.team].push(a.workerId)
            })
        }

        const handleRosterChange = (data: any) => {
            // Convert Record<team, userIds> back to WorkerAssignment[]
            const newAssignments: any[] = []
            Object.entries(data.assignments).forEach(([team, userIds]: [string, any]) => {
                if (Array.isArray(userIds)) {
                    userIds.forEach(uid => {
                        newAssignments.push({
                            workerId: uid,
                            team: team
                        })
                    })
                }
            })
            updateDraftAssignments(newAssignments)
        }

        return (
            <div className="h-full">
                <Step2Roster
                    data={{
                        pattern: draftConfig?.pattern_json || [],
                        assignments: draftAssignments.length > 0 ? assignmentsRecord : {}
                    }}
                    onChange={handleRosterChange}
                    onNext={() => setStep(3)}
                    onBack={() => setStep(1)}
                />
            </div>
        )
    }


    const filteredWorkers = workers.filter(worker =>
        worker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        worker.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        worker.groupName.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const sortedWorkers = [...filteredWorkers].sort((a, b) => {
        if (!sortConfig) return 0

        const aValue = a[sortConfig.key] || ""
        const bValue = b[sortConfig.key] || ""

        if (aValue < bValue) {
            return sortConfig.direction === "asc" ? -1 : 1
        }
        if (aValue > bValue) {
            return sortConfig.direction === "asc" ? 1 : -1
        }

        if (sortConfig.key === 'groupName') {
            const priorityA = getRolePriorityValue(a.role)
            const priorityB = getRolePriorityValue(b.role)
            return priorityA - priorityB
        }

        return 0
    })

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center">
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'list' | 'team')} className="w-[400px]">
                    <TabsList>
                        <TabsTrigger value="list">전체 명부 (List)</TabsTrigger>
                        <TabsTrigger value="team">조별 보기 (Team)</TabsTrigger>
                    </TabsList>
                </Tabs>

            </div>

            {viewMode === 'list' ? (
                <Card className="flex-1">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <div className="space-y-1">
                            <CardTitle className="text-base">근무자 명단</CardTitle>
                            <CardDescription>
                                전체 근무자의 인적사항을 관리합니다.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="이름, 이메일, 소속 검색..."
                                    className="pl-8 h-9 text-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <WorkerRegistrationDialog
                                onSuccess={fetchWorkers}
                                triggerClassName="h-9 whitespace-nowrap"
                                triggerVariant="outline"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort("name")}>근무자</TableHead>
                                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort("role")}>역할</TableHead>
                                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort("groupName")}>소속</TableHead>
                                        <TableHead className="cursor-pointer select-none" onClick={() => handleSort("status")}>근무배치</TableHead>
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
                                                            <p className="font-medium text-sm">{worker.name}</p>
                                                            <p className="text-xs text-muted-foreground">{worker.email.replace('@mbcplus.com', '')}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="font-normal">
                                                        {worker.role}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm">{worker.groupName}</TableCell>
                                                <TableCell>
                                                    <div
                                                        className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded-md w-fit transition-colors"
                                                        onClick={() => handleToggleStatus(worker)}
                                                    >
                                                        <div
                                                            className={`h-2 w-2 rounded-full ${worker.status === "active" ? "bg-green-500" : "bg-gray-300"}`}
                                                        />
                                                        <span className="text-sm">{worker.status === "active" ? "가능" : "불가"}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={worker.type === 'internal' ? 'secondary' : 'default'} className="font-normal">
                                                        {worker.type === 'internal' ? '순환' : '지원'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
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
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="flex-1 h-full">
                    <LiveRosterView />
                </div>
            )
            }

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
        </div >
    )
}
