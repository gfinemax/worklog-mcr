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
    created_by?: string
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
    creator?: {
        name: string
    }
    category?: {
        name: string
        slug: string
    }
    worklog?: {
        id: string
        work_date: string
        type: string
        group: {
            id: string
            name: string
        }
    }
    comments?: { count: number }[]
}

export interface Comment {
    id: string
    post_id: string
    author_id: string
    content: string
    created_at: string
    updated_at?: string
    parent_id?: string | null
    reactions?: Record<string, string[]> // emoji -> userIds[]
    author?: {
        name: string
    }
}

interface PostStore {
    posts: Post[]
    categories: Category[]
    loading: boolean
    fetchCategories: () => Promise<void>
    fetchPosts: (filters?: { categoryId?: string, priority?: string, search?: string, tag?: string }) => Promise<void>
    addPost: (post: Partial<Post>) => Promise<Post>
    updatePost: (id: string, updates: Partial<Post>) => Promise<void>
    resolvePost: (id: string, note: string) => Promise<void>
    deletePost: (id: string) => Promise<void>
    fetchComments: (postId: string) => Promise<Comment[]>
    addComment: (comment: Partial<Comment>) => Promise<void>
    updateComment: (id: string, updates: Partial<Comment>) => Promise<void>
    deleteComment: (id: string) => Promise<void>
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

        console.log('Fetched categories:', data)
        set({ categories: data })
    },

    fetchPosts: async (filters) => {
        set({ loading: true })
        let query = supabase
            .from('posts')
            .select(`
                *,
                author:users!posts_author_user_id_fkey(name),
                category:categories(name, slug),
                worklog:worklogs(id, work_date:date, type, group:groups(id, name)),
                comments(count)
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

        // Manually fetch creator info for posts with created_by
        const posts = data as any[]
        const creatorIds = [...new Set(posts.filter(p => p.created_by).map(p => p.created_by))]

        if (creatorIds.length > 0) {
            const { data: creators, error: creatorError } = await supabase
                .from('users')
                .select('id, name')
                .in('id', creatorIds)

            if (!creatorError && creators) {
                const creatorMap = new Map(creators.map(c => [c.id, c.name]))
                posts.forEach(post => {
                    if (post.created_by && creatorMap.has(post.created_by)) {
                        post.creator = { name: creatorMap.get(post.created_by) }
                    }
                })
            }
        }

        set({ posts: posts, loading: false })
    },

    addPost: async (post) => {
        console.log('Store adding post:', post)
        const { data, error } = await supabase
            .from('posts')
            .insert(post)
            .select()
            .single()

        if (error) {
            console.error('Error adding post:', JSON.stringify(error, null, 2))
            throw error
        }

        get().fetchPosts()
        return data
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
    },

    deletePost: async (id) => {
        const { error } = await supabase
            .from('posts')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting post:', error)
            throw error
        }

        get().fetchPosts()
    },

    fetchComments: async (postId) => {
        const { data, error } = await supabase
            .from('comments')
            .select(`
                *,
                author:users!comments_author_user_id_fkey(name)
            `)
            .eq('post_id', postId)
            .order('created_at', { ascending: true })

        if (error) {
            console.error('Error fetching comments:', error)
            return []
        }

        // Map author_user_id to author_id for the frontend
        return data.map((comment: any) => ({
            ...comment,
            author_id: comment.author_user_id,
        })) as Comment[]
    },

    addComment: async (comment) => {
        // Map author_id to author_user_id for the database
        const dbComment = {
            ...comment,
            author_user_id: comment.author_id,
        }
        delete (dbComment as any).author_id

        const { error } = await supabase
            .from('comments')
            .insert(dbComment)

        if (error) {
            console.error('Error adding comment:', error)
            throw error
        }
    },

    updateComment: async (id, updates) => {
        const { error } = await supabase
            .from('comments')
            .update(updates)
            .eq('id', id)

        if (error) {
            console.error('Error updating comment:', error)
            throw error
        }
    },

    deleteComment: async (id) => {
        const { error } = await supabase
            .from('comments')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Error deleting comment:', error)
            throw error
        }
    }
}))
