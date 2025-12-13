"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Phone, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { useContactsStore, Contact } from "@/store/contacts"
import { toast } from "sonner"

export default function ContactsSettingsPage() {
    const { contacts, loading, fetchContacts, addContact, updateContact, deleteContact } = useContactsStore()

    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingContact, setEditingContact] = useState<Contact | null>(null)
    const [formData, setFormData] = useState({ name: "", phone: "", 담당: "", 회사: "", 분류: "", 직책: "", 카테고리: "" })
    const [saving, setSaving] = useState(false)
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' })

    useEffect(() => {
        fetchContacts()
    }, [fetchContacts])

    const handleSort = (key: string) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }))
    }

    const renderSortIcon = (key: string) => {
        if (sortConfig.key === key) {
            return sortConfig.direction === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />
        }
        return <ArrowUpDown className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
    }

    const sortedContacts = [...contacts].sort((a, b) => {
        const { key, direction } = sortConfig
        const aValue = (a[key as keyof Contact] || '') as string
        const bValue = (b[key as keyof Contact] || '') as string

        if (aValue < bValue) return direction === 'asc' ? -1 : 1
        if (aValue > bValue) return direction === 'asc' ? 1 : -1
        return 0
    })

    const handleOpenAdd = () => {
        setEditingContact(null)
        setFormData({ name: "", phone: "", 담당: "", 회사: "", 분류: "", 직책: "", 카테고리: "" })
        setDialogOpen(true)
    }

    const handleOpenEdit = (contact: Contact) => {
        setEditingContact(contact)
        setFormData({
            name: contact.name,
            phone: contact.phone || "",
            담당: contact.담당 || "",
            회사: contact.회사 || "",
            분류: contact.분류 || "",
            직책: contact.직책 || "",
            카테고리: contact.카테고리 || ""
        })
        setDialogOpen(true)
    }

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast.error("이름을 입력해주세요.")
            return
        }

        setSaving(true)
        try {
            if (editingContact) {
                const success = await updateContact(editingContact.id, {
                    name: formData.name.trim(),
                    phone: formData.phone.trim() || null,
                    담당: formData.담당.trim() || null,
                    회사: formData.회사.trim() || null,
                    분류: formData.분류.trim() || null,
                    직책: formData.직책.trim() || null,
                    카테고리: formData.카테고리.trim() || null
                })
                if (success) {
                    toast.success("담당자가 수정되었습니다.")
                    setDialogOpen(false)
                } else {
                    toast.error("수정에 실패했습니다.")
                }
            } else {
                const result = await addContact(
                    formData.name.trim(),
                    formData.phone.trim(),
                    formData.담당.trim(),
                    formData.회사.trim(),
                    formData.분류.trim(),
                    formData.직책.trim(),
                    formData.카테고리.trim()
                )
                if (result) {
                    toast.success("담당자가 추가되었습니다.")
                    setDialogOpen(false)
                } else {
                    toast.error("추가에 실패했습니다.")
                }
            }
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (contact: Contact) => {
        if (!confirm(`"${contact.name}"을(를) 삭제하시겠습니까?`)) return

        const success = await deleteContact(contact.id)
        if (success) {
            toast.success("담당자가 삭제되었습니다.")
        } else {
            toast.error("삭제에 실패했습니다.")
        }
    }

    return (
        <MainLayout>
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">담당자 관리</h1>
                        <p className="text-muted-foreground">중계 일정 등록 시 사용할 담당자 연락처를 관리합니다.</p>
                    </div>
                    <Button onClick={handleOpenAdd}>
                        <Plus className="h-4 w-4 mr-2" />
                        담당자 추가
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Phone className="h-5 w-5" />
                            담당자 목록 ({contacts.length}명)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8 text-muted-foreground">
                                불러오는 중...
                            </div>
                        ) : contacts.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                등록된 담당자가 없습니다. "담당자 추가" 버튼을 클릭하여 추가하세요.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table className="[&_th]:px-2 [&_td]:px-2">
                                    <TableHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                                        <TableRow className="border-b-2 border-slate-200 dark:border-slate-700 hover:bg-transparent">
                                            <TableHead
                                                className={cn("min-w-[120px] text-center cursor-pointer select-none transition-colors hover:text-primary hover:bg-muted/50 group", sortConfig.key === 'name' && "text-primary font-bold bg-muted/30")}
                                                onClick={() => handleSort('name')}
                                            >
                                                <div className="flex items-center justify-center"><span className="w-4" />이름{renderSortIcon('name')}</div>
                                            </TableHead>
                                            <TableHead
                                                className={cn("min-w-[80px] text-center cursor-pointer select-none transition-colors hover:text-primary hover:bg-muted/50 group", sortConfig.key === '직책' && "text-primary font-bold bg-muted/30")}
                                                onClick={() => handleSort('직책')}
                                            >
                                                <div className="flex items-center justify-center"><span className="w-4" />직책{renderSortIcon('직책')}</div>
                                            </TableHead>
                                            <TableHead
                                                className={cn("min-w-[120px] text-center cursor-pointer select-none transition-colors hover:text-primary hover:bg-muted/50 group", sortConfig.key === 'phone' && "text-primary font-bold bg-muted/30")}
                                                onClick={() => handleSort('phone')}
                                            >
                                                <div className="flex items-center justify-center"><span className="w-4" />연락처{renderSortIcon('phone')}</div>
                                            </TableHead>
                                            <TableHead
                                                className={cn("min-w-[100px] text-center cursor-pointer select-none transition-colors hover:text-primary hover:bg-muted/50 group", sortConfig.key === '담당' && "text-primary font-bold bg-muted/30")}
                                                onClick={() => handleSort('담당')}
                                            >
                                                <div className="flex items-center justify-center"><span className="w-4" />담당{renderSortIcon('담당')}</div>
                                            </TableHead>
                                            <TableHead
                                                className={cn("min-w-[100px] text-center cursor-pointer select-none transition-colors hover:text-primary hover:bg-muted/50 group", sortConfig.key === '회사' && "text-primary font-bold bg-muted/30")}
                                                onClick={() => handleSort('회사')}
                                            >
                                                <div className="flex items-center justify-center"><span className="w-4" />회사{renderSortIcon('회사')}</div>
                                            </TableHead>
                                            <TableHead
                                                className={cn("min-w-[100px] text-center cursor-pointer select-none transition-colors hover:text-primary hover:bg-muted/50 group", sortConfig.key === '분류' && "text-primary font-bold bg-muted/30")}
                                                onClick={() => handleSort('분류')}
                                            >
                                                <div className="flex items-center justify-center"><span className="w-4" />분류{renderSortIcon('분류')}</div>
                                            </TableHead>
                                            <TableHead
                                                className={cn("min-w-[100px] text-center cursor-pointer select-none transition-colors hover:text-primary hover:bg-muted/50 group", sortConfig.key === '카테고리' && "text-primary font-bold bg-muted/30")}
                                                onClick={() => handleSort('카테고리')}
                                            >
                                                <div className="flex items-center justify-center"><span className="w-4" />카테고리{renderSortIcon('카테고리')}</div>
                                            </TableHead>
                                            <TableHead className="w-[100px] text-center">작업</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sortedContacts.map(contact => (
                                            <TableRow key={contact.id}>
                                                <TableCell className="font-medium min-w-[120px] text-center">{contact.name}</TableCell>
                                                <TableCell className="min-w-[80px] text-center">{contact.직책 || "-"}</TableCell>
                                                <TableCell className="min-w-[120px] text-center">{contact.phone || "-"}</TableCell>
                                                <TableCell className="min-w-[100px] text-center">{contact.담당 || "-"}</TableCell>
                                                <TableCell className="min-w-[100px] text-center">{contact.회사 || "-"}</TableCell>
                                                <TableCell className="min-w-[100px] text-center">{contact.분류 || "-"}</TableCell>
                                                <TableCell className="min-w-[100px] text-center">{contact.카테고리 || "-"}</TableCell>
                                                <TableCell className="w-[100px]">
                                                    <div className="flex gap-1 justify-center">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleOpenEdit(contact)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDelete(contact)}
                                                            className="text-red-600 hover:text-red-700"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingContact ? "담당자 수정" : "새 담당자 추가"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>이름 *</Label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="담당자 이름"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>직책</Label>
                            <Input
                                value={formData.직책}
                                onChange={(e) => setFormData({ ...formData, 직책: e.target.value })}
                                placeholder="직책 (선택)"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>연락처</Label>
                            <Input
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="연락처 (자유 형식)"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>담당</Label>
                            <Input
                                value={formData.담당}
                                onChange={(e) => {
                                    const new담당 = e.target.value
                                    const shouldSetCompany = new담당.toLowerCase().includes('mbc+') || new담당.toLowerCase().includes('liveu')
                                    setFormData({ 
                                        ...formData, 
                                        담당: new담당,
                                        회사: shouldSetCompany ? 'MBC Plus' : formData.회사
                                    })
                                }}
                                placeholder="담당 (선택)"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>회사</Label>
                            <Input
                                value={formData.회사}
                                onChange={(e) => setFormData({ ...formData, 회사: e.target.value })}
                                placeholder="회사 (선택)"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>분류</Label>
                            <Input
                                value={formData.분류}
                                onChange={(e) => setFormData({ ...formData, 분류: e.target.value })}
                                placeholder="분류 (선택)"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>카테고리</Label>
                            <Input
                                value={formData.카테고리}
                                onChange={(e) => setFormData({ ...formData, 카테고리: e.target.value })}
                                placeholder="카테고리 (선택)"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>
                            취소
                        </Button>
                        <Button onClick={handleSubmit} disabled={saving}>
                            {saving ? "저장 중..." : (editingContact ? "수정" : "추가")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </MainLayout>
    )
}
