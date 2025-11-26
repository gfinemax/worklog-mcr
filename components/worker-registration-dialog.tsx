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
    // Added for external staff email
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

    // Track active tab to control UI elements outside the tabs (like Team selection)
    const [activeTab, setActiveTab] = useState<'internal' | 'external'>('internal')

    const [loading, setLoading] = useState(false)
    const [groups, setGroups] = useState<{ id: string; name: string }[]>([])
    const [availableRoles, setAvailableRoles] = useState<{ id: number; name: string; type: string }[]>([])

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
        email: string
        name: string
        role: string[]
        // organization is removed from UI but kept for DB compatibility if needed, or we just use default
        organization: string
    }>({
        email: "",
        name: "",
        role: ["기술스텝"],
        organization: "지원",
    })

    useEffect(() => {
        if (open) {
            fetchGroups()
            fetchRoles()
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
                    setActiveTab('internal')
                    setInternalForm({
                        email: workerToEdit.email,
                        password: "",
                        name: workerToEdit.name,
                        role: roles.length > 0 ? roles : ["감독"],
                        groupId: "",
                    })
                } else {
                    setActiveTab('external')
                    setExternalForm({
                        email: workerToEdit.email || "", // Load email if exists
                        name: workerToEdit.name,
                        role: roles.length > 0 ? roles : ["기술스텝"],
                        organization: workerToEdit.team,
                    })
                }
            } else {
                setActiveTab('internal')
                setInternalForm({ email: "", password: "password1234", name: "", role: ["감독"], groupId: "" })
                setExternalForm({ email: "", name: "", role: ["기술스텝"], organization: "지원" })
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

    const fetchRoles = async () => {
        const { data, error } = await supabase.from("roles").select("*").order("order")
        if (error) {
            console.error("Error fetching roles:", error)
            toast.error("역할 목록을 불러오지 못했습니다.")
            return
        }
        if (data) setAvailableRoles(data)
    }

    const getRolesForType = (type: 'internal' | 'external') => {
        return availableRoles.filter(r => {
            if (type === 'internal') return r.type === 'rotational' || r.type === 'both'
            return r.type === 'support' || r.type === 'both'
        })
    }

    // Image Cropping State
    const [isEditingImage, setIsEditingImage] = useState(false)
    const [zoom, setZoom] = useState(1)
    const [pan, setPan] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const imageRef = useRef<HTMLImageElement>(null)

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            // Reset crop state
            setZoom(1)
            setPan({ x: 0, y: 0 })

            const url = URL.createObjectURL(file)
            setPreviewUrl(url)
            setIsEditingImage(true) // Start editing
        }
    }

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault()
        setIsDragging(true)
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return
        e.preventDefault()
        setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    const handleCropSave = async () => {
        if (!imageRef.current || !previewUrl) return

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Set canvas size (e.g., 300x300 for high quality avatar)
        const size = 300
        canvas.width = size
        canvas.height = size

        // Fill background
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, size, size)

        // Draw image with transforms
        // We need to map the DOM transforms to Canvas
        // The DOM container is likely 200x200 (preview size)
        const previewSize = 200
        const scaleFactor = size / previewSize

        ctx.save()
        // Move to center
        ctx.translate(size / 2, size / 2)
        // Apply pan (scaled)
        ctx.translate(pan.x * scaleFactor, pan.y * scaleFactor)
        // Apply zoom
        ctx.scale(zoom, zoom)
        // Draw image centered
        const img = imageRef.current
        // Calculate aspect ratio to fit/cover
        // For simplicity, we draw the image at its natural aspect ratio, centered
        // But in the DOM, we usually display it 'object-cover' or similar. 
        // Since we are doing manual transform, we should draw it at a base size that matches the preview.
        // Let's assume the base size in preview is "fit to container" or similar.
        // To make it robust:
        // 1. Determine rendered width/height in preview (before zoom).
        //    If we style the img as `w-full h-full object-contain` inside the 200px box?
        //    Actually, for manual pan/zoom, we usually set width/height to 'auto' or fixed.
        //    Let's set the image to be 200px wide (or height) base.

        let drawWidth = previewSize
        let drawHeight = (img.naturalHeight / img.naturalWidth) * previewSize

        if (img.naturalWidth < img.naturalHeight) {
            drawHeight = previewSize
            drawWidth = (img.naturalWidth / img.naturalHeight) * previewSize
        }

        ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight)
        ctx.restore()

        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], "avatar.png", { type: "image/png" })
                setImageFile(file)
                const createdUrl = URL.createObjectURL(file)
                setPreviewUrl(createdUrl) // Update preview with cropped version
                setIsEditingImage(false) // Exit edit mode
            }
        }, 'image/png')
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

            if (workerToEdit) {
                // Check for Type Switch: External -> Internal
                if (workerToEdit.type === 'external') {
                    // 1. SignUp (Create Auth User)
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

                    // 2. Create User Profile
                    const { error: profileError } = await supabase.from("users").upsert({
                        id: userId,
                        email: internalForm.email,
                        name: internalForm.name,
                        role: roleString,
                        profile_image_url: imageUrl,
                        is_active: true,
                    })

                    if (profileError) throw profileError

                    // 3. Add to Group
                    if (internalForm.groupId) {
                        const { error: memberError } = await supabase.from("group_members").upsert({
                            group_id: internalForm.groupId,
                            user_id: userId,
                            role: roleString,
                        })
                        if (memberError) throw memberError
                    }

                    // 4. Delete from support_staff
                    const { error: deleteError } = await supabase
                        .from("support_staff")
                        .delete()
                        .eq("id", workerToEdit.id)

                    if (deleteError) {
                        console.error("Failed to delete old support staff record", deleteError)
                    }

                    toast.success("지원 근무자가 순환 근무자로 변경되었습니다.")
                } else {
                    // Normal Update (Internal -> Internal)
                    if (imageFile) {
                        const uploadedUrl = await uploadImage(workerToEdit.id)
                        if (uploadedUrl) imageUrl = uploadedUrl
                    }

                    // Check if email has changed
                    if (internalForm.email !== workerToEdit.email) {
                        const { error: emailError } = await supabase.rpc('update_user_email', {
                            target_user_id: workerToEdit.id,
                            new_email: internalForm.email
                        })

                        if (emailError) throw new Error(`이메일 변경 실패: ${emailError.message}`)
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
                    toast.success("순환 근무자 정보가 수정되었습니다.")
                }
            } else {
                // Create New Internal
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
                toast.success("순환 근무자가 등록되었습니다.")
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

            if (workerToEdit) {
                // Check for Type Switch: Internal -> External
                if (workerToEdit.type === 'internal') {
                    // 1. Insert into support_staff (New ID)
                    const { data, error } = await supabase.from("support_staff").insert({
                        name: externalForm.name,
                        email: externalForm.email,
                        role: roleString,
                        organization: externalForm.organization,
                        is_active: true,
                        profile_image_url: imageUrl
                    }).select().single()

                    if (error) throw error

                    // 2. Upload new image if file selected
                    if (imageFile && data) {
                        const uploadedUrl = await uploadImage(data.id)
                        if (uploadedUrl) {
                            await supabase.from("support_staff").update({ profile_image_url: uploadedUrl }).eq('id', data.id)
                        }
                    }

                    // 3. Delete from users (Public table)
                    const { error: deleteError } = await supabase
                        .from("users")
                        .delete()
                        .eq("id", workerToEdit.id)

                    if (deleteError) {
                        console.error("Failed to delete old user record", deleteError)
                    }

                    toast.success("순환 근무자가 지원 근무자로 변경되었습니다.")
                } else {
                    // Normal Update (External -> External)
                    if (imageFile) {
                        const uploadedUrl = await uploadImage(workerToEdit.id)
                        if (uploadedUrl) imageUrl = uploadedUrl
                    }

                    const { error } = await supabase
                        .from("support_staff")
                        .update({
                            name: externalForm.name,
                            email: externalForm.email,
                            role: roleString,
                            organization: externalForm.organization,
                            profile_image_url: imageUrl
                        })
                        .eq("id", workerToEdit.id)

                    if (error) throw error
                    toast.success("지원 근무자 정보가 수정되었습니다.")
                }
            } else {
                // Create New External
                const { data, error } = await supabase.from("support_staff").insert({
                    name: externalForm.name,
                    email: externalForm.email,
                    role: roleString,
                    organization: externalForm.organization,
                    is_active: true,
                }).select().single()

                if (error) throw error

                if (imageFile && data) {
                    const uploadedUrl = await uploadImage(data.id)
                    if (uploadedUrl) {
                        await supabase.from("support_staff").update({ profile_image_url: uploadedUrl }).eq('id', data.id)
                    }
                }
                toast.success("지원 근무자가 등록되었습니다.")
            }
            setOpen(false)
            onSuccess()
        } catch (error: any) {
            toast.error("작업 실패: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    const toggleGroupItemClasses = "data-[state=on]:bg-green-100 data-[state=on]:text-green-700 data-[state=on]:border-green-500 border border-transparent hover:bg-muted/50 transition-all duration-200 px-2 py-0.5 text-sm rounded-md"

    const handleTabChange = (value: string) => {
        setActiveTab(value as 'internal' | 'external')
        if (value === 'external') {
            setExternalForm(prev => ({
                ...prev,
                name: internalForm.name || prev.name,
                email: internalForm.email || prev.email
            }))
        } else {
            setInternalForm(prev => ({
                ...prev,
                name: externalForm.name || prev.name,
                email: externalForm.email || prev.email
            }))
        }
    }

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
                <Draggable handle=".drag-handle" nodeRef={nodeRef} disabled={isEditingImage}>
                    <div ref={nodeRef} className="bg-background border rounded-lg shadow-lg w-full">
                        <DialogHeader className="drag-handle cursor-move p-6 pb-2">
                            <div className="flex items-center gap-2">
                                <GripHorizontal className="h-5 w-5 text-muted-foreground" />
                                <DialogTitle>{workerToEdit ? "근무자 정보 수정" : "근무자 등록"}</DialogTitle>
                            </div>
                        </DialogHeader>

                        <div className="p-6 pt-0">
                            {isEditingImage ? (
                                <div className="flex flex-col items-center space-y-4">
                                    <div className="text-sm font-medium">프로필 사진 편집</div>
                                    <div
                                        className="relative w-[200px] h-[200px] rounded-full overflow-hidden border-2 border-muted cursor-move bg-black/5"
                                        onMouseDown={handleMouseDown}
                                        onMouseMove={handleMouseMove}
                                        onMouseUp={handleMouseUp}
                                        onMouseLeave={handleMouseUp}
                                    >
                                        {/* Helper text overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 opacity-0 hover:opacity-100 transition-opacity">
                                            <span className="text-xs text-white bg-black/50 px-2 py-1 rounded">드래그하여 이동</span>
                                        </div>

                                        <img
                                            ref={imageRef}
                                            src={previewUrl || ""}
                                            alt="Preview"
                                            className="absolute max-w-none origin-center select-none"
                                            style={{
                                                // Center the image initially
                                                left: '50%',
                                                top: '50%',
                                                // Apply transforms
                                                transform: `translate(-50%, -50%) translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                                                // Set base size to fit container (contain)
                                                width: imageRef.current && imageRef.current.naturalWidth < imageRef.current.naturalHeight ? 'auto' : '200px',
                                                height: imageRef.current && imageRef.current.naturalWidth < imageRef.current.naturalHeight ? '200px' : 'auto',
                                            }}
                                            draggable={false}
                                        />
                                    </div>

                                    <div className="w-full max-w-[200px] space-y-2">
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>축소</span>
                                            <span>확대</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="1"
                                            max="3"
                                            step="0.1"
                                            value={zoom}
                                            onChange={(e) => setZoom(parseFloat(e.target.value))}
                                            className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>

                                    <div className="flex gap-2 w-full justify-center">
                                        <Button variant="outline" onClick={() => {
                                            setIsEditingImage(false)
                                            setPreviewUrl(null) // Cancel upload
                                            setImageFile(null)
                                        }}>취소</Button>
                                        <Button onClick={handleCropSave}>적용</Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-col items-center mb-6">
                                        <div className="flex items-center gap-6 w-full justify-center">
                                            {/* Profile Image */}
                                            <div className="flex flex-col items-center">
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

                                            {/* Team Selection (Only for Internal) */}
                                            {activeTab === 'internal' && (
                                                <div className="flex flex-col gap-2 min-w-[120px]">
                                                    <Label className="text-lg font-semibold">근무조</Label>
                                                    <Select
                                                        value={internalForm.groupId}
                                                        onValueChange={(val) => setInternalForm({ ...internalForm, groupId: val })}
                                                    >
                                                        <SelectTrigger className="h-12 text-lg">
                                                            <SelectValue placeholder="조 선택" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {groups.map((g) => (
                                                                <SelectItem key={g.id} value={g.id} className="text-lg">
                                                                    {g.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <Tabs defaultValue={workerToEdit?.type || "internal"} className="w-full" onValueChange={handleTabChange}>
                                        <TabsList className="grid w-full grid-cols-2">
                                            <TabsTrigger value="internal">순환 근무자</TabsTrigger>
                                            <TabsTrigger value="external">지원 근무자</TabsTrigger>
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
                                                            {getRolesForType('internal').map((role) => (
                                                                <ToggleGroupItem key={role.id} value={role.name} className={toggleGroupItemClasses}>
                                                                    {role.name}
                                                                </ToggleGroupItem>
                                                            ))}
                                                        </ToggleGroup>
                                                    </div>
                                                    {/* Team Selection Moved to Top */}
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
                                                    <Label htmlFor="ext-email">이메일</Label>
                                                    <Input
                                                        id="ext-email"
                                                        type="email"
                                                        placeholder="support@example.com"
                                                        value={externalForm.email}
                                                        onChange={(e) => setExternalForm({ ...externalForm, email: e.target.value })}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="ext-name">이름</Label>
                                                    <Input
                                                        id="ext-name"
                                                        required
                                                        placeholder="지원 근무자 이름"
                                                        value={externalForm.name}
                                                        onChange={(e) => setExternalForm({ ...externalForm, name: e.target.value })}
                                                    />
                                                </div>
                                                {/* Organization Removed from UI */}
                                                <div className="space-y-2">
                                                    <Label>역할 (복수 선택 가능)</Label>
                                                    <ToggleGroup
                                                        type="multiple"
                                                        variant="outline"
                                                        value={externalForm.role}
                                                        onValueChange={(val) => setExternalForm({ ...externalForm, role: val })}
                                                        className="justify-start flex-wrap gap-2"
                                                    >
                                                        {getRolesForType('external').map((role) => (
                                                            <ToggleGroupItem key={role.id} value={role.name} className={toggleGroupItemClasses}>
                                                                {role.name}
                                                            </ToggleGroupItem>
                                                        ))}
                                                    </ToggleGroup>
                                                </div>
                                                <Button type="submit" className="w-full" disabled={loading}>
                                                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                    {workerToEdit ? "수정하기" : "등록하기"}
                                                </Button>
                                            </form>
                                        </TabsContent>
                                    </Tabs>
                                </>
                            )}
                        </div>
                    </div>
                </Draggable>
            </DialogContent>
        </Dialog>
    )
}
