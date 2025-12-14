import { Contact } from "@/store/contacts"

export type FilterTab = "category" | "division" | "company"

const normalize = (value: string | null | undefined) => (value || "").toLowerCase()

export function filterContacts(
    contacts: Contact[],
    opts: {
        query: string
        filterTab: FilterTab
        categoryTab: string
        categoryTerm: string
        divisionTerm: string
        companyTerm: string
    }
) {
    const { query, filterTab, categoryTab, categoryTerm, divisionTerm, companyTerm } = opts
    const normalizedQuery = query.trim().toLowerCase()
    const categoryQuery = categoryTerm.trim().toLowerCase()
    const divisionQuery = divisionTerm.trim().toLowerCase()
    const companyQuery = companyTerm.trim().toLowerCase()

    return contacts.filter((contact) => {
        const matchesQuery = !normalizedQuery || [
            contact.name,
            contact.phone,
            contact.담당,
            contact.회사,
            contact.분류,
            contact.직책,
            contact.카테고리,
        ].some((field) => normalize(field).includes(normalizedQuery))

        const normalizeCategory = normalize(contact.카테고리)
        const normalizeDivision = normalize(contact.분류)
        const normalizeCompany = normalize(contact.회사)

        const isSearching = !!normalizedQuery

        const matchesCategory =
            isSearching ? true :
                filterTab !== "category" ? true :
                    categoryTab === "all" ? true :
                        categoryTab === "__uncategorized__" ? !contact.카테고리?.trim() :
                            (contact.카테고리 || "").trim() === categoryTab

        const matchesDivision =
            isSearching ? true :
                filterTab !== "division" ? true :
                    divisionTerm === "" ? true :
                        divisionTerm === "__uncategorized__" ? !contact.분류?.trim() :
                            normalizeDivision === divisionQuery

        const matchesCompany =
            isSearching ? true :
                filterTab !== "company" ? true :
                    companyTerm === "" ? true :
                        companyTerm === "__uncategorized__" ? !contact.회사?.trim() :
                            normalizeCompany === companyQuery

        return matchesQuery && matchesCompany && matchesCategory && matchesDivision
    })
}
