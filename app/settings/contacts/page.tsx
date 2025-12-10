"use client"

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Plus, Pencil, Trash2, Phone, Building } from "lucide-react"
import { useContactsStore, Contact } from "@/store/contacts"
import { toast } from "sonner"

// 전화번호 자동 포맷 (010-1234-5678)
const formatPhoneNumber = (value: string): string => {
    const numbers = value.replace(/[^\d]/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`
}

export default function ContactsSettingsPage() {
    const { contacts, loading, fetchContacts, addContact, updateContact, deleteContact } = useContactsStore()

    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingContact, setEditingContact] = useState<Contact | null>(null)
    const [formData, setFormData] = useState({ name: "", phone: "", organization: "" })
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchContacts()
    }, [fetchContacts])

    const handleOpenAdd = () => {
        setEditingContact(null)
        setFormData({ name: "", phone: "", organization: "" })
        setDialogOpen(true)
    }

    const handleOpenEdit = (contact: Contact) => {
        setEditingContact(contact)
        setFormData({
            name: contact.name,
            phone: contact.phone || "",
            organization: contact.organization || ""
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
                    organization: formData.organization.trim() || null
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
                    formData.organization.trim()
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
            <div className="max-w-4xl mx-auto space-y-6">
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
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>이름</TableHead>
                                        <TableHead>연락처</TableHead>
                                        <TableHead>소속</TableHead>
                                        <TableHead className="w-[100px]">작업</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {contacts.map(contact => (
                                        <TableRow key={contact.id}>
                                            <TableCell className="font-medium">{contact.name}</TableCell>
                                            <TableCell>{contact.phone || "-"}</TableCell>
                                            <TableCell>{contact.organization || "-"}</TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
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
                            <Label>연락처</Label>
                            <Input
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
                                placeholder="010-0000-0000"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>소속</Label>
                            <Input
                                value={formData.organization}
                                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                                placeholder="소속 (선택)"
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
