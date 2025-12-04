"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, X, Search, ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { SessionMember } from "@/store/auth"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface SessionSetupStepProps {
    groupName: string
    shiftType?: string | null
    initialMembers: SessionMember[]
    onConfirm: (members: SessionMember[]) => void
    onCancel?: () => void
    confirmLabel?: string
    loading?: boolean
}

export function SessionSetupStep({
    groupName,
    shiftType,
    initialMembers,
    onConfirm,
    onCancel,
    confirmLabel = "근무 시작하기",
    loading = false
}: SessionSetupStepProps) {
    const [members, setMembers] = useState<SessionMember[]>(initialMembers)
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [searchMode, setSearchMode] = useState<'substitute' | 'add'>('add')
    const [targetMemberId, setTargetMemberId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<any[]>([])
    const [availableRoles, setAvailableRoles] = useState<string[]>(["감독", "부감독", "영상"])

    useEffect(() => {
        setMembers(initialMembers)
    }, [initialMembers])

    useEffect(() => {
        const fetchRoles = async () => {
            const { data } = await supabase.from("roles").select("name").eq("type", "both").order("order")
            if (data && data.length > 0) {
                setAvailableRoles(data.map(r => r.name))
            }
        }
        fetchRoles()
    }, [])

    const handleRoleChange = (memberId: string, newRole: string) => {
        setMembers(prev => prev.map(m =>
            m.id === memberId ? { ...m, role: newRole } : m
        ))
    }

    const openSearch = (mode: 'substitute' | 'add', memberId?: string) => {
        setSearchMode(mode)
        setTargetMemberId(memberId || null)
        setSearchQuery("")
        setSearchResults([])
        setIsSearchOpen(true)
    }

    const handleSearch = async (query: string) => {
        setSearchQuery(query)
        if (query.length < 1) {
            setSearchResults([])
            return
        }

        const { data: users } = await supabase
            .from('users')
            .select('id, name, role, profile_image_url')
            .ilike('name', `%${query}%`)
            .limit(5)

        const { data: staff } = await supabase
            .from('support_staff')
            .select('id, name, role')
            .ilike('name', `%${query}%`)
            .limit(5)

        const combined = [
            ...(users || []).map((u: any) => ({ ...u, type: 'internal' })),
            ...(staff || []).map((s: any) => ({ ...s, type: 'external', profile_image_url: null }))
        ]
        setSearchResults(combined)
    }

    const handleSelectWorker = (worker: any) => {
        if (searchMode === 'substitute' && targetMemberId) {
            setMembers(prev => prev.map(m => {
                if (m.id === targetMemberId) {
                    return {
                        id: worker.id,
                        name: worker.name,
                        role: m.role,
                        isSubstitute: true,
                        originalMemberId: m.id,
                        profile_image_url: worker.profile_image_url
                    }
                }
                return m
            }))
            toast.success(`${worker.name}님으로 교체되었습니다.`)
        } else {
            if (members.find(m => m.id === worker.id)) {
                toast.error("이미 목록에 있는 근무자입니다.")
                return
            }
            setMembers(prev => [...prev, {
                id: worker.id,
                name: worker.name,
                role: '영상',
                isSubstitute: false,
                profile_image_url: worker.profile_image_url
            }])
            toast.success(`${worker.name}님이 추가되었습니다.`)
        }
        setIsSearchOpen(false)
    }

    const handleRemoveMember = (memberId: string) => {
        setMembers(prev => prev.filter(m => m.id !== memberId))
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                {onCancel && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onCancel}
                        className="text-slate-500 hover:text-slate-900"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" /> 뒤로가기
                    </Button>
                )}
                <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full ml-auto">
                    {groupName} {shiftType && `(${shiftType})`}
                </span>
            </div>

            <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-slate-900">근무자 확정</h2>
                <p className="text-slate-500 text-sm">오늘 함께 근무할 멤버와 역할을 확인해주세요.</p>
            </div>

            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="text-slate-500 pl-1 text-xs uppercase tracking-wider font-semibold">
                        현재 멤버 ({members.length}명)
                    </Label>
                    <Button variant="ghost" size="sm" className="h-6 text-xs text-blue-600 hover:text-blue-700" onClick={() => openSearch('add')}>
                        <Plus className="h-3 w-3 mr-1" /> 근무자 추가
                    </Button>
                </div>

                <div className="space-y-3">
                    {members.map((member) => (
                        <div
                            key={member.id}
                            className="relative flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-200"
                        >
                            <Avatar className="h-10 w-10 border border-slate-100">
                                <AvatarImage src={member.profile_image_url} />
                                <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">
                                    {member.name[0]}
                                </AvatarFallback>
                            </Avatar>

                            <div className="flex flex-col flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-slate-700">{member.name}</span>
                                    {member.isSubstitute && (
                                        <Badge variant="secondary" className="text-[10px] h-4 px-1 bg-orange-100 text-orange-700">교체됨</Badge>
                                    )}
                                </div>
                                <Select value={member.role} onValueChange={(val) => handleRoleChange(member.id, val)}>
                                    <SelectTrigger className="h-7 text-xs border-none shadow-none p-0 focus:ring-0 w-fit gap-1 text-slate-500 font-medium">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableRoles.map(role => (
                                            <SelectItem key={role} value={role} className="text-xs">{role}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2 text-xs text-slate-400 hover:text-blue-600"
                                    onClick={() => openSearch('substitute', member.id)}
                                >
                                    교체
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-slate-400 hover:text-red-600"
                                    onClick={() => handleRemoveMember(member.id)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <Button
                onClick={() => onConfirm(members)}
                disabled={loading || members.length === 0}
                className="w-full h-12 mt-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all font-medium text-base"
            >
                {loading ? "처리 중..." : confirmLabel}
            </Button>

            <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{searchMode === 'substitute' ? '근무자 교체' : '근무자 추가'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="이름 검색..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                            />
                        </div>
                        <ScrollArea className="h-[200px] rounded-md border p-2">
                            {searchResults.length === 0 ? (
                                <div className="text-center text-sm text-muted-foreground py-8">
                                    검색 결과가 없습니다.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {searchResults.map((worker) => (
                                        <div
                                            key={worker.id}
                                            className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                                            onClick={() => handleSelectWorker(worker)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={worker.profile_image_url} />
                                                    <AvatarFallback>{worker.name[0]}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{worker.name}</span>
                                                    <span className="text-xs text-muted-foreground">{worker.role}</span>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="text-[10px]">
                                                {worker.type === 'internal' ? '순환' : '지원'}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
