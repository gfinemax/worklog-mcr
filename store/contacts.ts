import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

export interface Contact {
    id: string
    name: string
    phone: string | null
    organization: string | null
    is_active: boolean
    created_at: string
    updated_at: string
}

interface ContactsState {
    contacts: Contact[]
    loading: boolean
    error: string | null

    fetchContacts: () => Promise<void>
    addContact: (name: string, phone?: string, organization?: string) => Promise<Contact | null>
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

    addContact: async (name: string, phone?: string, organization?: string) => {
        try {
            const { data, error } = await supabase
                .from('contacts')
                .insert({ name, phone: phone || null, organization: organization || null })
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
            const { error } = await supabase
                .from('contacts')
                .update(data)
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
