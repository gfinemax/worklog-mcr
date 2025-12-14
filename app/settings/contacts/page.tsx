"use client"

import { Suspense, useState, useEffect, useMemo } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Tabs } from "@/components/ui/tabs"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { SimplePagination, usePagination } from "@/components/ui/simple-pagination"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { FolderTabsList, FolderTabsTrigger } from "@/components/ui/folder-tabs"
import { Plus, Pencil, Trash2, Phone, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { useContactsStore, Contact } from "@/store/contacts"
import { filterContacts, FilterTab } from "./filter"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"

function ContactsSettingsContent() {
    const { contacts, loading, fetchContacts, addContact, updateContact, deleteContact } = useContactsStore()

    const router = useRouter()
    const searchParams = useSearchParams()

    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingContact, setEditingContact] = useState<Contact | null>(null)
    const [detailOpen, setDetailOpen] = useState(false)
    const [detailContact, setDetailContact] = useState<Contact | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)
    const [filterTab, setFilterTab] = useState<"category" | "division" | "company">("category")
    const [categoryTab, setCategoryTab] = useState("all")
    const [searchTerm, setSearchTerm] = useState("")
    const [companyTerm, setCompanyTerm] = useState("")
    const [categoryTerm, setCategoryTerm] = useState("")
    const [divisionTerm, setDivisionTerm] = useState("")
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

    useEffect(() => {
        const initialCategory = searchParams.get("category")
        if (initialCategory) {
            setCategoryTab(initialCategory)
        }
        const initialDivision = searchParams.get("division")
        if (initialDivision) {
            setDivisionTerm(initialDivision)
        }
        const initialCompany = searchParams.get("company")
        if (initialCompany) {
            setCompanyTerm(initialCompany)
        }
    }, [searchParams])

    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {}
        contacts.forEach((contact) => {
            const key = (contact.카테고리 || "").trim()
            const normalized = key || "__uncategorized__"
            counts[normalized] = (counts[normalized] || 0) + 1
        })
        const entries = Object.entries(counts)
            .filter(([key]) => key !== "__uncategorized__")
            .sort((a, b) => {
                if (b[1] !== a[1]) return b[1] - a[1] // count desc
                return a[0].localeCompare(b[0]) // name asc
            })
        const hasUncategorized = counts["__uncategorized__"] || 0
        return { entries, hasUncategorized }
    }, [contacts])

    const divisionCounts = useMemo(() => {
        const counts: Record<string, number> = {}
        contacts.forEach((contact) => {
            const key = (contact.분류 || "").trim()
            const normalized = key || "__uncategorized__"
            counts[normalized] = (counts[normalized] || 0) + 1
        })
        const entries = Object.entries(counts)
            .filter(([key]) => key !== "__uncategorized__")
            .sort((a, b) => {
                if (b[1] !== a[1]) return b[1] - a[1]
                return a[0].localeCompare(b[0])
            })
        const hasUncategorized = counts["__uncategorized__"] || 0
        return { entries, hasUncategorized }
    }, [contacts])

    const companyOptions = useMemo(() => {
        const set = new Set<string>()
        contacts.forEach((c) => {
            const v = (c.회사 || "").trim()
            if (v) set.add(v)
        })
        return Array.from(set).sort((a, b) => a.localeCompare(b))
    }, [contacts])

    const companyCounts = useMemo(() => {
        const counts: Record<string, number> = {}
        contacts.forEach((contact) => {
            const key = (contact.회사 || "").trim()
            const normalized = key || "__uncategorized__"
            counts[normalized] = (counts[normalized] || 0) + 1
        })
        const entries = Object.entries(counts)
            .filter(([key]) => key !== "__uncategorized__")
            .sort((a, b) => {
                if (b[1] !== a[1]) return b[1] - a[1]
                return a[0].localeCompare(b[0])
            })
        const hasUncategorized = counts["__uncategorized__"] || 0
        return { entries, hasUncategorized }
    }, [contacts])

    const updateQueryParams = (nextCategory?: string, nextDivision?: string, nextCompany?: string) => {
        const params = new URLSearchParams(searchParams.toString())
        const categoryValue = nextCategory !== undefined ? nextCategory : categoryTab
        const divisionValue = nextDivision !== undefined ? nextDivision : divisionTerm
        const companyValue = nextCompany !== undefined ? nextCompany : companyTerm

        if (!categoryValue || categoryValue === "all") params.delete("category")
        else params.set("category", categoryValue)

        if (!divisionValue) params.delete("division")
        else params.set("division", divisionValue)

        if (!companyValue) params.delete("company")
        else params.set("company", companyValue)

        const query = params.toString()
        router.push(query ? `?${query}` : "?", { scroll: false })
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

    const filteredContacts = filterContacts(sortedContacts, {
        query: searchTerm,
        filterTab,
        categoryTab,
        categoryTerm,
        divisionTerm,
        companyTerm,
    })

    const { totalPages, getPageItems, totalItems } = usePagination(filteredContacts, pageSize)
    const pagedContacts = getPageItems(currentPage)
    const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
    const endIndex = Math.min(currentPage * pageSize, totalItems)

    useEffect(() => {
        setCurrentPage(1)
    }, [sortConfig.key, sortConfig.direction, pageSize, searchTerm, companyTerm, categoryTerm, divisionTerm, categoryTab])

    useEffect(() => {
        if (totalPages <= 0) return
        if (currentPage > totalPages) setCurrentPage(totalPages)
    }, [currentPage, totalPages])

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

    const handleOpenDetail = (contact: Contact) => {
        setDetailContact(contact)
        setDetailOpen(true)
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
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
                            <CardTitle className="flex items-center gap-2">
                                <Phone className="h-5 w-5" />
                                담당자 목록 ({contacts.length}명)
                            </CardTitle>
                            <Input
                                className="md:max-w-sm"
                                placeholder="이름, 연락처, 담당, 회사 등 전체 검색"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3 mb-4">
                            <Tabs value={filterTab} onValueChange={(v) => setFilterTab(v as typeof filterTab)} className="space-y-2">
                                <div className="overflow-x-auto pb-1">
                                    <FolderTabsList className="min-w-max">
                                        <FolderTabsTrigger value="category">카테고리</FolderTabsTrigger>
                                        <FolderTabsTrigger value="division">분류</FolderTabsTrigger>
                                        <FolderTabsTrigger value="company">회사</FolderTabsTrigger>
                                    </FolderTabsList>
                                </div>
                                <Card className="border bg-slate-50/60 dark:bg-slate-900/40 w-full py-3 gap-3">
                                    <CardContent className="px-3 py-1">
                                        {filterTab === "category" && (
                                            <div className="flex flex-wrap gap-1">
                                                <label className={cn(
                                                    "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm leading-tight cursor-pointer min-w-[110px] max-w-[160px]",
                                                    categoryTab === "all" ? "border-primary/50 bg-primary/5" : "hover:bg-muted"
                                                )}>
                                                    <input
                                                        type="radio"
                                                        name="category"
                                                        value="all"
                                                        checked={categoryTab === "all"}
                                                        onChange={() => {
                                                            setCategoryTab("all")
                                                            setCategoryTerm("")
                                                            updateQueryParams("all", undefined, undefined)
                                                        }}
                                                        className="h-4 w-4"
                                                    />
                                                    <span className="truncate">전체 ({contacts.length})</span>
                                                </label>
                                                {categoryCounts.entries.map(([value, count]) => (
                                                    <label key={value} className={cn(
                                                        "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm leading-tight cursor-pointer min-w-[110px] max-w-[160px]",
                                                        categoryTab === value ? "border-primary/50 bg-primary/5" : "hover:bg-muted"
                                                    )}>
                                                        <input
                                                            type="radio"
                                                            name="category"
                                                            value={value}
                                                            checked={categoryTab === value}
                                                            onChange={() => {
                                                                setCategoryTab(value)
                                                                setCategoryTerm(value)
                                                                updateQueryParams(value, undefined, undefined)
                                                            }}
                                                            className="h-4 w-4"
                                                        />
                                                        <span className="truncate">{value} ({count})</span>
                                                    </label>
                                                ))}
                                                {categoryCounts.hasUncategorized > 0 && (
                                                    <label className={cn(
                                                        "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm leading-tight cursor-pointer min-w-[110px] max-w-[160px]",
                                                        categoryTab === "__uncategorized__" ? "border-primary/50 bg-primary/5" : "hover:bg-muted"
                                                    )}>
                                                        <input
                                                            type="radio"
                                                            name="category"
                                                            value="__uncategorized__"
                                                            checked={categoryTab === "__uncategorized__"}
                                                            onChange={() => {
                                                                setCategoryTab("__uncategorized__")
                                                                setCategoryTerm("__uncategorized__")
                                                                updateQueryParams("__uncategorized__", undefined, undefined)
                                                            }}
                                                            className="h-4 w-4"
                                                        />
                                                        <span className="truncate">미분류 ({categoryCounts.hasUncategorized})</span>
                                                    </label>
                                                )}
                                            </div>
                                        )}
                                        {filterTab === "division" && (
                                            <div className="flex flex-wrap gap-1">
                                                <label className={cn(
                                                    "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm leading-tight cursor-pointer min-w-[110px] max-w-[160px]",
                                                    divisionTerm === "" ? "border-primary/50 bg-primary/5" : "hover:bg-muted"
                                                )}>
                                                    <input
                                                        type="radio"
                                                        name="division"
                                                        value="all"
                                                        checked={divisionTerm === ""}
                                                        onChange={() => {
                                                            setDivisionTerm("")
                                                            updateQueryParams(undefined, "", undefined)
                                                        }}
                                                        className="h-4 w-4"
                                                    />
                                                    <span className="truncate">전체 ({contacts.length})</span>
                                                </label>
                                                {divisionCounts.entries.map(([value, count]) => (
                                                    <label key={value} className={cn(
                                                        "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm leading-tight cursor-pointer min-w-[110px] max-w-[160px]",
                                                        divisionTerm === value ? "border-primary/50 bg-primary/5" : "hover:bg-muted"
                                                    )}>
                                                        <input
                                                            type="radio"
                                                            name="division"
                                                            value={value}
                                                            checked={divisionTerm === value}
                                                            onChange={() => {
                                                                setDivisionTerm(value)
                                                                updateQueryParams(undefined, value, undefined)
                                                            }}
                                                            className="h-4 w-4"
                                                        />
                                                        <span className="truncate">{value} ({count})</span>
                                                    </label>
                                                ))}
                                                {divisionCounts.hasUncategorized > 0 && (
                                                    <label className={cn(
                                                        "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm leading-tight cursor-pointer min-w-[110px] max-w-[160px]",
                                                        divisionTerm === "__uncategorized__" ? "border-primary/50 bg-primary/5" : "hover:bg-muted"
                                                    )}>
                                                        <input
                                                            type="radio"
                                                            name="division"
                                                            value="__uncategorized__"
                                                            checked={divisionTerm === "__uncategorized__"}
                                                            onChange={() => {
                                                                setDivisionTerm("__uncategorized__")
                                                                updateQueryParams(undefined, "__uncategorized__", undefined)
                                                            }}
                                                            className="h-4 w-4"
                                                        />
                                                        <span className="truncate">미분류 ({divisionCounts.hasUncategorized})</span>
                                                    </label>
                                                )}
                                            </div>
                                        )}
                                        {filterTab === "company" && (
                                            <div className="flex flex-wrap gap-1">
                                                <label className={cn(
                                                    "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm leading-tight cursor-pointer min-w-[110px] max-w-[160px]",
                                                    companyTerm === "" ? "border-primary/50 bg-primary/5" : "hover:bg-muted"
                                                )}>
                                                    <input
                                                        type="radio"
                                                        name="company"
                                                        value="all"
                                                        checked={companyTerm === ""}
                                                        onChange={() => {
                                                            setCompanyTerm("")
                                                            updateQueryParams(undefined, undefined, "")
                                                        }}
                                                        className="h-4 w-4"
                                                    />
                                                    <span className="truncate">전체 ({contacts.length})</span>
                                                </label>
                                                {companyCounts.entries.map(([value, count]) => (
                                                    <label key={value} className={cn(
                                                        "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm leading-tight cursor-pointer min-w-[110px] max-w-[160px]",
                                                        companyTerm === value ? "border-primary/50 bg-primary/5" : "hover:bg-muted"
                                                    )}>
                                                        <input
                                                            type="radio"
                                                            name="company"
                                                            value={value}
                                                            checked={companyTerm === value}
                                                            onChange={() => {
                                                                setCompanyTerm(value)
                                                                updateQueryParams(undefined, undefined, value)
                                                            }}
                                                            className="h-4 w-4"
                                                        />
                                                        <span className="truncate">{value} ({count})</span>
                                                    </label>
                                                ))}
                                                {companyCounts.hasUncategorized > 0 && (
                                                    <label className={cn(
                                                        "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-sm leading-tight cursor-pointer min-w-[110px] max-w-[160px]",
                                                        companyTerm === "__uncategorized__" ? "border-primary/50 bg-primary/5" : "hover:bg-muted"
                                                    )}>
                                                        <input
                                                            type="radio"
                                                            name="company"
                                                            value="__uncategorized__"
                                                            checked={companyTerm === "__uncategorized__"}
                                                            onChange={() => {
                                                                setCompanyTerm("__uncategorized__")
                                                                updateQueryParams(undefined, undefined, "__uncategorized__")
                                                            }}
                                                            className="h-4 w-4"
                                                        />
                                                        <span className="truncate">미분류 ({companyCounts.hasUncategorized})</span>
                                                    </label>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </Tabs>
                        </div>

                        <div className="mb-2" />

                        {loading ? (
                            <div className="text-center py-8 text-muted-foreground">
                                불러오는 중...
                            </div>
                        ) : contacts.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                등록된 담당자가 없습니다. "담당자 추가" 버튼을 클릭하여 추가하세요.
                            </div>
                        ) : filteredContacts.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                검색 결과가 없습니다. 검색어를 확인해주세요.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <Table className="[&_th]:px-1 [&_td]:px-1 [&_th]:h-9 [&_td]:py-1">
                                    <TableHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                                        <TableRow className="border-b-2 border-slate-200 dark:border-slate-700 hover:bg-transparent">
                                            <TableHead
                                                className={cn("sticky left-0 z-20 w-[140px] bg-gradient-to-r from-slate-50 to-slate-100 cursor-pointer select-none transition-colors hover:text-primary hover:bg-muted/50 group dark:from-slate-800 dark:to-slate-900", sortConfig.key === 'name' && "text-primary font-bold bg-muted/30")}
                                                onClick={() => handleSort('name')}
                                            >
                                                <div className="flex items-center justify-start pl-1"><span className="w-4" />이름{renderSortIcon('name')}</div>
                                            </TableHead>
                                            <TableHead
                                                className={cn("hidden md:table-cell w-[90px] text-center cursor-pointer select-none transition-colors hover:text-primary hover:bg-muted/50 group", sortConfig.key === '직책' && "text-primary font-bold bg-muted/30")}
                                                onClick={() => handleSort('직책')}
                                            >
                                                <div className="flex items-center justify-center"><span className="w-4" />직책{renderSortIcon('직책')}</div>
                                            </TableHead>
                                            <TableHead
                                                className={cn("w-[150px] cursor-pointer select-none transition-colors hover:text-primary hover:bg-muted/50 group", sortConfig.key === 'phone' && "text-primary font-bold bg-muted/30")}
                                                onClick={() => handleSort('phone')}
                                            >
                                                <div className="flex items-center justify-start pl-1"><span className="w-4" />연락처{renderSortIcon('phone')}</div>
                                            </TableHead>
                                            <TableHead
                                                className={cn("hidden md:table-cell w-[120px] text-center cursor-pointer select-none transition-colors hover:text-primary hover:bg-muted/50 group", sortConfig.key === '담당' && "text-primary font-bold bg-muted/30")}
                                                onClick={() => handleSort('담당')}
                                            >
                                                <div className="flex items-center justify-center"><span className="w-4" />담당{renderSortIcon('담당')}</div>
                                            </TableHead>
                                            <TableHead
                                                className={cn("w-[140px] text-center cursor-pointer select-none transition-colors hover:text-primary hover:bg-muted/50 group", sortConfig.key === '회사' && "text-primary font-bold bg-muted/30")}
                                                onClick={() => handleSort('회사')}
                                            >
                                                <div className="flex items-center justify-center"><span className="w-4" />회사{renderSortIcon('회사')}</div>
                                            </TableHead>
                                            <TableHead
                                                className={cn("hidden lg:table-cell w-[120px] text-center cursor-pointer select-none transition-colors hover:text-primary hover:bg-muted/50 group", sortConfig.key === '분류' && "text-primary font-bold bg-muted/30")}
                                                onClick={() => handleSort('분류')}
                                            >
                                                <div className="flex items-center justify-center"><span className="w-4" />분류{renderSortIcon('분류')}</div>
                                            </TableHead>
                                            <TableHead
                                                className={cn("hidden xl:table-cell w-[140px] text-center cursor-pointer select-none transition-colors hover:text-primary hover:bg-muted/50 group", sortConfig.key === '카테고리' && "text-primary font-bold bg-muted/30")}
                                                onClick={() => handleSort('카테고리')}
                                            >
                                                <div className="flex items-center justify-center"><span className="w-4" />카테고리{renderSortIcon('카테고리')}</div>
                                            </TableHead>
                                            {/* 작업 컬럼 제거 */}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pagedContacts.map(contact => (
                                            <TableRow
                                                key={contact.id}
                                                className="cursor-pointer group"
                                                onClick={() => handleOpenDetail(contact)}
                                            >
                                                <TableCell className="sticky left-0 z-10 w-[140px] bg-background font-medium group-hover:bg-muted/50">
                                                    <div className="truncate" title={contact.name}>
                                                        {contact.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell w-[90px] text-center">
                                                    <div className="truncate" title={contact.직책 || ""}>
                                                        {contact.직책 || "-"}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="w-[150px]">
                                                    <div className="truncate" title={contact.phone || ""}>
                                                        {contact.phone || "-"}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell w-[120px] text-center">
                                                    <div className="truncate" title={contact.담당 || ""}>
                                                        {contact.담당 || "-"}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="w-[140px] text-center">
                                                    <div className="truncate" title={contact.회사 || ""}>
                                                        {contact.회사 || "-"}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell w-[120px] text-center">
                                                    <div className="truncate" title={contact.분류 || ""}>
                                                        {contact.분류 || "-"}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden xl:table-cell w-[140px] text-center">
                                                    <div className="truncate" title={contact.카테고리 || ""}>
                                                        {contact.카테고리 || "-"}
                                                    </div>
                                                </TableCell>
                                                {/* 작업 컬럼 제거 */}
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-4">
                                    <div className="flex items-center justify-between sm:justify-start gap-3 text-sm text-muted-foreground w-full sm:w-auto">
                                        <span className="tabular-nums">
                                            {startIndex}-{endIndex} / {totalItems}명
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span>페이지당</span>
                                            <Select
                                                value={String(pageSize)}
                                                onValueChange={(value) => setPageSize(Number(value))}
                                            >
                                                <SelectTrigger size="sm">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="10">10</SelectItem>
                                                    <SelectItem value="20">20</SelectItem>
                                                    <SelectItem value="50">50</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <SimplePagination
                                        currentPage={currentPage}
                                        totalPages={totalPages}
                                        onPageChange={setCurrentPage}
                                        className="py-0"
                                    />
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Detail Dialog */}
            <Dialog
                open={detailOpen}
                onOpenChange={(open) => {
                    setDetailOpen(open)
                    if (!open) setDetailContact(null)
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>담당자 상세</DialogTitle>
                    </DialogHeader>
                    {detailContact ? (
                        <div className="grid grid-cols-1 gap-3 py-2 text-sm">
                            <div className="flex justify-between gap-4"><span className="text-muted-foreground">이름</span><span className="text-right font-medium">{detailContact.name}</span></div>
                            <div className="flex justify-between gap-4"><span className="text-muted-foreground">직책</span><span className="text-right">{detailContact.직책 || "-"}</span></div>
                            <div className="flex justify-between gap-4"><span className="text-muted-foreground">연락처</span><span className="text-right">{detailContact.phone || "-"}</span></div>
                            <div className="flex justify-between gap-4"><span className="text-muted-foreground">담당</span><span className="text-right">{detailContact.담당 || "-"}</span></div>
                            <div className="flex justify-between gap-4"><span className="text-muted-foreground">회사</span><span className="text-right">{detailContact.회사 || "-"}</span></div>
                            <div className="flex justify-between gap-4"><span className="text-muted-foreground">분류</span><span className="text-right">{detailContact.분류 || "-"}</span></div>
                            <div className="flex justify-between gap-4"><span className="text-muted-foreground">카테고리</span><span className="text-right">{detailContact.카테고리 || "-"}</span></div>
                        </div>
                    ) : null}
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setDetailOpen(false)}
                        >
                            닫기
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                if (!detailContact) return
                                setDetailOpen(false)
                                handleOpenEdit(detailContact)
                            }}
                            disabled={!detailContact}
                        >
                            수정
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={async () => {
                                if (!detailContact) return
                                setDetailOpen(false)
                                await handleDelete(detailContact)
                            }}
                            disabled={!detailContact}
                        >
                            삭제
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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

export default function ContactsSettingsPage() {
    return (
        <Suspense fallback={<MainLayout><div className="p-6">Loading...</div></MainLayout>}>
            <ContactsSettingsContent />
        </Suspense>
    )
}
