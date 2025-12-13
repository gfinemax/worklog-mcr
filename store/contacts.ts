import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface Contact {
    id: string
    name: string
    phone: string | null
    담당: string | null
    회사: string | null
    분류: string | null
    직책: string | null
    카테고리: string | null
    is_active: boolean
    created_at: string
    updated_at: string
}

interface ContactsState {
    contacts: Contact[]
    loading: boolean
    error: string | null

    fetchContacts: () => Promise<void>
    addContact: (name: string, phone?: string, 담당?: string, 회사?: string, 분류?: string, 직책?: string, 카테고리?: string) => Promise<Contact | null>
    updateContact: (id: string, data: Partial<Contact>) => Promise<boolean>
    deleteContact: (id: string) => Promise<boolean>
}

export const useContactsStore = create<ContactsState>((set, get) => ({
    contacts: [],
    loading: false,
    error: null,

    fetchContacts: async () => {
        set({ loading: true, error: null })
        try {
            const { data, error } = await supabase
                .from('contacts')
                .select('*')
                .eq('is_active', true)
                .order('name')

            if (error) throw error
            set({ contacts: data || [], loading: false })
        } catch (error: any) {
            console.error('Error fetching contacts:', error)
            set({ error: error.message, loading: false })
        }
    },

    addContact: async (name: string, phone?: string, 담당?: string, 회사?: string, 분류?: string, 직책?: string, 카테고리?: string) => {
        try {
            // Auto-set 회사 based on 담당 content
            let final회사 = 회사
            if (담당 && (담당.toLowerCase().includes('mbc+') || 담당.toLowerCase().includes('liveu'))) {
                final회사 = 'MBC Plus'
            }

            const { data, error } = await supabase
                .from('contacts')
                .insert({ name, phone: phone || null, 담당: 담당 || null, 회사: final회사 || null, 분류: 분류 || null, 직책: 직책 || null, 카테고리: 카테고리 || null })
                .select()
                .single()

            if (error) throw error

            // Refresh the list
            await get().fetchContacts()
            return data
        } catch (error: any) {
            console.error('Error adding contact:', error)
            set({ error: error.message })
            return null
        }
    },

    updateContact: async (id: string, data: Partial<Contact>) => {
        try {
            // Auto-set 회사 based on 담당 content if 담당 is being updated
            const updateData = { ...data }
            if (data.담당 && (data.담당.toLowerCase().includes('mbc+') || data.담당.toLowerCase().includes('liveu'))) {
                updateData.회사 = 'MBC Plus'
            }

            const { error } = await supabase
                .from('contacts')
                .update(updateData)
                .eq('id', id)

            if (error) throw error

            // Refresh the list
            await get().fetchContacts()
            return true
        } catch (error: any) {
            console.error('Error updating contact:', error)
            set({ error: error.message })
            return false
        }
    },

    deleteContact: async (id: string) => {
        try {
            // Soft delete
            const { error } = await supabase
                .from('contacts')
                .update({ is_active: false })
                .eq('id', id)

            if (error) throw error

            // Refresh the list
            await get().fetchContacts()
            return true
        } catch (error: any) {
            console.error('Error deleting contact:', error)
            set({ error: error.message })
            return false
        }
    },
}))
