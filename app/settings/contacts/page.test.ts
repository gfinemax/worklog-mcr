import { describe, it, expect } from "vitest"
import { filterContacts, FilterTab } from "./filter"
import { Contact } from "@/store/contacts"

const makeContact = (overrides: Partial<Contact>): Contact => ({
    id: overrides.id || Math.random().toString(),
    name: overrides.name || "",
    phone: overrides.phone || null,
    담당: overrides.담당 || null,
    회사: overrides.회사 || null,
    분류: overrides.분류 || null,
    직책: overrides.직책 || null,
    카테고리: overrides.카테고리 || null,
    is_active: true,
    created_at: "",
    updated_at: "",
})

describe("filterContacts", () => {
    const baseOpts = {
        filterTab: "category" as FilterTab,
        categoryTab: "all",
        categoryTerm: "",
        divisionTerm: "",
        companyTerm: "",
    }

    it("search ignores filters and searches all contacts", () => {
        const contacts = [
            makeContact({ name: "화평식당 고기덮밥", 카테고리: "식당" }),
            makeContact({ name: "KT 본사", 카테고리: "통신", 회사: "KT" }),
        ]

        const result = filterContacts(contacts, {
            ...baseOpts,
            filterTab: "category",
            categoryTab: "식당",
            query: "KT",
        })

        expect(result.map((c) => c.name)).toContain("KT 본사")
    })

    it("filters only by active tab when no search", () => {
        const contacts = [
            makeContact({ name: "A", 분류: "국내외 회선" }),
            makeContact({ name: "B", 분류: "기타" }),
        ]

        const result = filterContacts(contacts, {
            ...baseOpts,
            filterTab: "division",
            divisionTerm: "국내외 회선",
            query: "",
        })

        expect(result.map((c) => c.name)).toEqual(["A"])
    })
})
