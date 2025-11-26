import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export interface Category {
    id: string
    name: string
    slug: string
    description?: string
}

export interface Attachment {
    name: string
    url: string
    type: string
    size: number
}

export interface Post {
    id: string
    category_id: string
    author_id: string
    worklog_id?: string
    title: string
    content: string
    summary?: string
    priority: '일반' | '중요' | '긴급'
    status: 'open' | 'resolved'
    resolution_note?: string
    channel?: string
    tags: string[]
    attachments: Attachment[]
    views: number
    likes: number
    created_at: string
    author?: {
        name: string
    }
    category?: {
        name: string
        slug: string
    }
}

interface PostStore {
    posts: Post[]
    categories: Category[]
    loading: boolean
    fetchCategories: () => Promise<void>
    fetchPosts: (filters?: { categoryId?: string, priority?: string, search?: string, tag?: string }) => Promise<void>
    addPost: (post: Partial<Post>) => Promise<void>
    updatePost: (id: string, updates: Partial<Post>) => Promise<void>
    resolvePost: (id: string, note: string) => Promise<void>
}

export const usePostStore = create<PostStore>((set, get) => ({
    posts: [],
    categories: [],
    loading: false,

    fetchCategories: async () => {
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('name')

        if (error) {
            console.error('Error fetching categories:', error)
            return
        }

        set({ categories: data })
    },

    fetchPosts: async (filters) => {
        set({ loading: true })
        let query = supabase
            .from('posts')
            .select(`
                *,
                author:users(name),
                category:categories(name, slug)
            `)
            .order('created_at', { ascending: false })

        if (filters?.categoryId) {
            query = query.eq('category_id', filters.categoryId)
        }
        if (filters?.priority) {
            query = query.eq('priority', filters.priority)
        }
        if (filters?.search) {
            query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`)
        }
        if (filters?.tag) {
            query = query.contains('tags', [filters.tag])
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching posts:', JSON.stringify(error, null, 2))
            set({ loading: false })
            return
        }

        set({ posts: data as any, loading: false })
    },

    addPost: async (post) => {
        const { error } = await supabase
            .from('posts')
            .insert(post)

        if (error) {
            console.error('Error adding post:', error)
            throw error
        }

        get().fetchPosts()
    },

    updatePost: async (id, updates) => {
        const { error } = await supabase
            .from('posts')
            .update(updates)
            .eq('id', id)

        if (error) {
            console.error('Error updating post:', error)
            throw error
        }

        get().fetchPosts()
    },

    resolvePost: async (id, note) => {
        const { error } = await supabase
            .from('posts')
            .update({ status: 'resolved', resolution_note: note })
            .eq('id', id)

        if (error) {
            console.error('Error resolving post:', error)
            throw error
        }

        get().fetchPosts()
    }
}))
