
"use client"

import { useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { authService } from "@/lib/auth"
import { toast } from "sonner"
import { Loader2, Lock } from "lucide-react"

interface UserInfo {
    id: string
    name: string
    role: string
    profile_image_url?: string
}

interface PinVerificationDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title?: string
    description?: string
    members: UserInfo[]
    onSuccess: (user: UserInfo) => void
    defaultSelectedId?: string | null
}

export function PinVerificationDialog({
    open,
    onOpenChange,
    title = "보안 인증",
    description = "중요한 작업을 수행하기 위해 본인 인증이 필요합니다.",
    members,
    onSuccess,
    defaultSelectedId
}: PinVerificationDialogProps) {
    const [selectedUserId, setSelectedUserId] = useState<string | null>(defaultSelectedId || null)

    // Update selectedUserId when defaultSelectedId changes or dialog opens
    // This is important if the dialog is reused
    if (open && defaultSelectedId && selectedUserId !== defaultSelectedId) {
        setSelectedUserId(defaultSelectedId)
    }
    const [pin, setPin] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(false)

    const handleVerify = async () => {
        if (!selectedUserId || pin.length < 4) return

        setLoading(true)
        setError(false)

        try {
            const isValid = await authService.verifyPin(selectedUserId, pin)
            if (isValid) {
                const user = members.find(m => m.id === selectedUserId)
                if (user) {
                    onSuccess(user)
                    onOpenChange(false)
                    setPin("")
                    setSelectedUserId(null)
                }
            } else {
                setError(true)
                toast.error("PIN 번호가 일치하지 않습니다.")
            }
        } catch (err) {
            console.error(err)
            toast.error("인증 중 오류가 발생했습니다.")
        } finally {
            setLoading(false)
        }
    }

    const handleUserSelect = (id: string) => {
        setSelectedUserId(id)
        setPin("")
        setError(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-blue-500" />
                        {title}
                    </DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="space-y-3">
                        <Label>인증할 근무자 선택</Label>
                        <div className="grid grid-cols-1 gap-2">
                            {members.map((member) => (
                                <div
                                    key={member.id}
                                    onClick={() => handleUserSelect(member.id)}
                                    className={`
                                        flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                                        ${selectedUserId === member.id
                                            ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                                            : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                                        }
                                    `}
                                >
                                    <Avatar className="h-10 w-10 border border-slate-100">
                                        <AvatarImage src={member.profile_image_url} />
                                        <AvatarFallback>{member.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold text-slate-900">{member.name}</span>
                                        <span className="text-xs text-slate-500">{member.role}</span>
                                    </div>
                                    {selectedUserId === member.id && (
                                        <div className="ml-auto h-2 w-2 rounded-full bg-blue-500" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {selectedUserId && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                            <Label htmlFor="pin">PIN 번호 (4자리)</Label>
                            <Input
                                id="pin"
                                type="password"
                                maxLength={4}
                                value={pin}
                                onChange={(e) => {
                                    setPin(e.target.value.replace(/[^0-9]/g, ""))
                                    setError(false)
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && pin.length === 4) {
                                        handleVerify()
                                    }
                                }}
                                className={`text-center text-lg tracking-[0.5em] font-bold h-12 ${error ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                                placeholder="••••"
                                autoFocus
                            />
                            {error && (
                                <p className="text-xs text-red-500 text-center font-medium">
                                    비밀번호가 올바르지 않습니다. 다시 시도해주세요.
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>취소</Button>
                    <Button
                        onClick={handleVerify}
                        disabled={!selectedUserId || pin.length < 4 || loading}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "인증하기"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
