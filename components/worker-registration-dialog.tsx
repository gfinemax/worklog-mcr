"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Plus, Loader2, GripHorizontal, Upload, X } from "lucide-react"
import Draggable from "react-draggable"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface WorkerData {
    id: string
    name: string
    email: string
    role: string
    team: string
    type: 'internal' | 'external'
    profile_image_url?: string
}

interface WorkerRegistrationDialogProps {
    onSuccess: () => void
    workerToEdit?: WorkerData | null
    open?: boolean
    onOpenChange?: (open: boolean) => void
}

export function WorkerRegistrationDialog({
    onSuccess,
    workerToEdit,
    open: controlledOpen,
    onOpenChange: setControlledOpen
}: WorkerRegistrationDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const nodeRef = useRef(null)

    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const setOpen = isControlled ? setControlledOpen! : setInternalOpen

    const [loading, setLoading] = useState(false)
    const [groups, setGroups] = useState<{ id: string; name: string }[]>([])

    // Image Upload State
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [previewUrl, setPreviewUrl] = useState<string | null>(null)

    // Form States
    const [internalForm, setInternalForm] = useState<{
        email: string
        password: string
        name: string
        role: string[]
        groupId: string
    }>({
        email: "",
        password: "password1234",
        name: "",
        role: ["조원"],
        groupId: "",
    })

    const [externalForm, setExternalForm] = useState<{
        name: string
        role: string[]
        organization: string
    }>({
        name: "",
        role: ["지원인력"],
        organization: "외부지원",
    })

    useEffect(() => {
        if (open) {
            fetchGroups()
            // Reset Image
            setImageFile(null)
            setPreviewUrl(null)

            if (workerToEdit) {
                // Set Preview if exists
                if (workerToEdit.profile_image_url) {
                    setPreviewUrl(workerToEdit.profile_image_url)
                }

                const roles = workerToEdit.role ? workerToEdit.role.split(',').map(r => r.trim()) : []

                if (workerToEdit.type === 'internal') {
                    setInternalForm({
                        email: workerToEdit.email,
                        password: "",
                        name: workerToEdit.name,
                        role: roles.length > 0 ? roles : ["조원"],
                        groupId: "",
                    })
                } else {
                    setExternalForm({
                        name: workerToEdit.name,
                        role: roles.length > 0 ? roles : ["지원인력"],
                        organization: workerToEdit.team,
                    })
                }
            } else {
                setInternalForm({ email: "", password: "password1234", name: "", role: ["조원"], groupId: "" })
                setExternalForm({ name: "", role: ["지원인력"], organization: "외부지원" })
            }
        }
    }, [open, workerToEdit])

    useEffect(() => {
        if (open && workerToEdit?.type === 'internal' && groups.length > 0) {
            const group = groups.find(g => g.name === workerToEdit.team)
            if (group) {
                setInternalForm(prev => ({ ...prev, groupId: group.id }))
            }
        }
    }, [open, workerToEdit, groups])

    const fetchGroups = async () => {
        const { data } = await supabase.from("groups").select("id, name").order("name")
        if (data) setGroups(data)
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setImageFile(file)
            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
        }
    }

    const uploadImage = async (userId: string) => {
        if (!imageFile) return null

        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${userId}-${Date.now()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, imageFile)

        if (uploadError) {
            console.error('Upload error:', uploadError)
            return null
        }

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
        return data.publicUrl
    }

    const handleInternalSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const roleString = internalForm.role.join(", ")

        try {
            let imageUrl = previewUrl

            // If editing and no new file, keep existing. If new file, upload.
            // If creating, upload if file exists.

            // We need userId for filename. 
            // If creating, we get ID after signup. 
            // If editing, we have workerToEdit.id.

            if (workerToEdit) {
                if (imageFile) {
                    const uploadedUrl = await uploadImage(workerToEdit.id)
                    if (uploadedUrl) imageUrl = uploadedUrl
                }

                const { error: userError } = await supabase
                    .from("users")
                    .update({
                        name: internalForm.name,
                        role: roleString,
                        profile_image_url: imageUrl
                    })
                    .eq("id", workerToEdit.id)

                if (userError) throw userError

                if (internalForm.groupId) {
                    const { data: existingMember } = await supabase
                        .from("group_members")
                        .select("*")
                        .eq("user_id", workerToEdit.id)
                        .single()

                    if (existingMember) {
                        const { error: memberError } = await supabase
                            .from("group_members")
                            .update({ group_id: internalForm.groupId, role: roleString })
                            .eq("user_id", workerToEdit.id)
                        if (memberError) throw memberError
                    } else {
                        const { error: memberError } = await supabase
                            .from("group_members")
                            .insert({ group_id: internalForm.groupId, user_id: workerToEdit.id, role: roleString })
                        if (memberError) throw memberError
                    }
                }
                toast.success("사내 근무자 정보가 수정되었습니다.")
            } else {
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: internalForm.email,
                    password: internalForm.password,
                    options: {
                        data: { name: internalForm.name },
                    },
                })

                if (authError) throw authError
                if (!authData.user) throw new Error("회원가입 실패")

                const userId = authData.user.id

                if (imageFile) {
                    const uploadedUrl = await uploadImage(userId)
                    if (uploadedUrl) imageUrl = uploadedUrl
                }

                const { error: profileError } = await supabase.from("users").upsert({
                    id: userId,
                    email: internalForm.email,
                    name: internalForm.name,
                    role: roleString,
                    profile_image_url: imageUrl,
                    is_active: true,
                })

                if (profileError) throw profileError

                if (internalForm.groupId) {
                    const { error: memberError } = await supabase.from("group_members").upsert({
                        group_id: internalForm.groupId,
                        user_id: userId,
                        role: roleString,
                    })
                    if (memberError) throw memberError
                }
                toast.success("사내 근무자가 등록되었습니다.")
            }
            setOpen(false)
            onSuccess()
        } catch (error: any) {
            toast.error("작업 실패: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    const handleExternalSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        const roleString = externalForm.role.join(", ")

        try {
            let imageUrl = previewUrl
            // For external, we generate ID on insert, or use existing ID.
            // If creating, we insert first to get ID? Or generate UUID?
            // Supabase client doesn't return ID on insert unless we select.

            if (workerToEdit) {
                if (imageFile) {
                    const uploadedUrl = await uploadImage(workerToEdit.id)
                    if (uploadedUrl) imageUrl = uploadedUrl
                }

                const { error } = await supabase
                    .from("external_staff")
                    .update({
                        name: externalForm.name,
                        role: roleString,
                        organization: externalForm.organization,
                        profile_image_url: imageUrl
                    })
                    .eq("id", workerToEdit.id)

                if (error) throw error
                toast.success("외부 지원 인력 정보가 수정되었습니다.")
            } else {
                // Insert first to get ID
                const { data, error } = await supabase.from("external_staff").insert({
                    name: externalForm.name,
                    role: roleString,
                    organization: externalForm.organization,
                    is_active: true,
                }).select().single()

                if (error) throw error

                if (imageFile && data) {
                    const uploadedUrl = await uploadImage(data.id)
                    if (uploadedUrl) {
                        await supabase.from("external_staff").update({ profile_image_url: uploadedUrl }).eq('id', data.id)
                    }
                }
                toast.success("외부 지원 인력이 등록되었습니다.")
            }
            setOpen(false)
            onSuccess()
        } catch (error: any) {
            toast.error("작업 실패: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    const toggleGroupItemClasses = "data-[state=on]:bg-primary/10 data-[state=on]:text-primary data-[state=on]:border-primary/50 border border-transparent hover:bg-muted/50 transition-all duration-200"

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {!isControlled && (
                <DialogTrigger asChild>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        근무자 추가
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[425px] p-0 border-none shadow-none bg-transparent">
                <Draggable handle=".drag-handle" nodeRef={nodeRef}>
                    <div ref={nodeRef} className="bg-background border rounded-lg shadow-lg w-full">
                        <DialogHeader className="drag-handle cursor-move p-6 pb-2">
                            <div className="flex items-center gap-2">
                                <GripHorizontal className="h-5 w-5 text-muted-foreground" />
                                <DialogTitle>{workerToEdit ? "근무자 정보 수정" : "근무자 등록"}</DialogTitle>
                            </div>
                        </DialogHeader>

                        <div className="p-6 pt-0">
                            {/* Profile Image Upload Section */}
                            <div className="flex flex-col items-center mb-6">
                                <div className="relative group cursor-pointer" onClick={() => document.getElementById('image-upload')?.click()}>
                                    <Avatar className="h-24 w-24 border-2 border-muted">
                                        <AvatarImage src={previewUrl || ""} className="object-cover" />
                                        <AvatarFallback className="text-2xl bg-muted">
                                            {workerToEdit?.name?.[0] || <Upload className="h-8 w-8 text-muted-foreground" />}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Upload className="h-6 w-6 text-white" />
                                    </div>
                                    <Input
                                        id="image-upload"
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageChange}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">프로필 사진 변경</p>
                            </div>

                            <Tabs defaultValue={workerToEdit?.type || "internal"} className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="internal" disabled={workerToEdit?.type === 'external'}>사내 근무자</TabsTrigger>
                                    <TabsTrigger value="external" disabled={workerToEdit?.type === 'internal'}>외부 지원</TabsTrigger>
                                </TabsList>

                                {/* Internal Worker Form */}
                                <TabsContent value="internal">
                                    <form onSubmit={handleInternalSubmit} className="space-y-4 pt-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="email">이메일</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                required
                                                placeholder="user@mbcplus.com"
                                                value={internalForm.email}
                                                onChange={(e) => setInternalForm({ ...internalForm, email: e.target.value })}
                                                disabled={!!workerToEdit}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="name">이름</Label>
                                            <Input
                                                id="name"
                                                required
                                                placeholder="홍길동"
                                                value={internalForm.name}
                                                onChange={(e) => setInternalForm({ ...internalForm, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2 col-span-2">
                                                <Label>역할 (복수 선택 가능)</Label>
                                                <ToggleGroup
                                                    type="multiple"
                                                    variant="outline"
                                                    value={internalForm.role}
                                                    onValueChange={(val) => setInternalForm({ ...internalForm, role: val })}
                                                    className="justify-start flex-wrap gap-2"
                                                >
                                                    <ToggleGroupItem value="감독" className={toggleGroupItemClasses}>감독</ToggleGroupItem>
                                                    <ToggleGroupItem value="부감독" className={toggleGroupItemClasses}>부감독</ToggleGroupItem>
                                                    <ToggleGroupItem value="영상" className={toggleGroupItemClasses}>영상</ToggleGroupItem>
                                                    <ToggleGroupItem value="조원" className={toggleGroupItemClasses}>조원</ToggleGroupItem>
                                                </ToggleGroup>
                                            </div>
                                            <div className="space-y-2 col-span-2">
                                                <Label>소속 조</Label>
                                                <Select
                                                    value={internalForm.groupId}
                                                    onValueChange={(val) => setInternalForm({ ...internalForm, groupId: val })}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="조 선택" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {groups.map((g) => (
                                                            <SelectItem key={g.id} value={g.id}>
                                                                {g.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        {!workerToEdit && (
                                            <div className="space-y-2">
                                                <Label htmlFor="password">비밀번호 (기본값)</Label>
                                                <Input
                                                    id="password"
                                                    type="password"
                                                    value={internalForm.password}
                                                    onChange={(e) => setInternalForm({ ...internalForm, password: e.target.value })}
                                                />
                                            </div>
                                        )}
                                        <Button type="submit" className="w-full" disabled={loading}>
                                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {workerToEdit ? "수정하기" : "등록하기"}
                                        </Button>
                                    </form>
                                </TabsContent>

                                {/* External Staff Form */}
                                <TabsContent value="external">
                                    <form onSubmit={handleExternalSubmit} className="space-y-4 pt-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="ext-name">이름</Label>
                                            <Input
                                                id="ext-name"
                                                required
                                                placeholder="외부 인력 이름"
                                                value={externalForm.name}
                                                onChange={(e) => setExternalForm({ ...externalForm, name: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="ext-org">소속 (업체명 등)</Label>
                                            <Input
                                                id="ext-org"
                                                required
                                                placeholder="외부지원"
                                                value={externalForm.organization}
                                                onChange={(e) => setExternalForm({ ...externalForm, organization: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>역할 (복수 선택 가능)</Label>
                                            <ToggleGroup
                                                type="multiple"
                                                variant="outline"
                                                value={externalForm.role}
                                                onValueChange={(val) => setExternalForm({ ...externalForm, role: val })}
                                                className="justify-start flex-wrap gap-2"
                                            >
                                                <ToggleGroupItem value="지원인력" className={toggleGroupItemClasses}>지원인력</ToggleGroupItem>
                                                <ToggleGroupItem value="감독" className={toggleGroupItemClasses}>감독</ToggleGroupItem>
                                                <ToggleGroupItem value="부감독" className={toggleGroupItemClasses}>부감독</ToggleGroupItem>
                                                <ToggleGroupItem value="관리" className={toggleGroupItemClasses}>관리</ToggleGroupItem>
                                            </ToggleGroup>
                                        </div>
                                        <Button type="submit" className="w-full" disabled={loading}>
                                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {workerToEdit ? "수정하기" : "등록하기"}
                                        </Button>
                                    </form>
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>
                </Draggable>
            </DialogContent>
        </Dialog>
    )
}
