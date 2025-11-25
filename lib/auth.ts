import { supabase } from './supabase'

export const authService = {
    // 1. Login (Individual)
    async login(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) throw error
        if (!data.user) throw new Error('No user data returned')

        // Fetch user profile to get name and role
        const { data: userProfile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single()

        if (profileError) throw profileError

        return {
            user: data.user,
            profile: userProfile,
        }
    },

    // 1.5 Signup
    async signup(email: string, password: string, name: string) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                },
            },
        })

        if (error) throw error

        // We also need to create a user profile in the 'users' table
        // This is usually handled by a trigger, but if not, we do it manually.
        // Given the schema has `id REFERENCES auth.users`, we should insert if trigger doesn't exist.
        // For safety in this demo, let's try to insert. If it fails (due to trigger), we ignore.
        if (data.user) {
            const { error: profileError } = await supabase
                .from('users')
                .insert({
                    id: data.user.id,
                    email: email,
                    name: name,
                    role: 'tech_staff' // default role
                })
                .select()

            // If error is duplicate key, it means trigger handled it or user exists.
            if (profileError && profileError.code !== '23505') {
                console.error("Profile creation error:", profileError)
                // We don't throw here because auth user was created.
            }
        }

        return data
    },

    // 2. Start Session (Opener)
    // This sets the active_members for the group to the default members
    async startSession(groupId: string, openerUserId: string) {
        // First, get the default members for this group (from group_members table)
        const { data: defaultMembers, error: membersError } = await supabase
            .from('group_members')
            .select('user_id')
            .eq('group_id', groupId)

        if (membersError) throw membersError

        const memberIds = defaultMembers.map(m => m.user_id)

        // Ensure opener is included if not already
        if (!memberIds.includes(openerUserId)) {
            memberIds.push(openerUserId)
        }

        // Update the group's active_members
        const { error: updateError } = await supabase
            .from('groups')
            .update({
                active_members: memberIds,
            })
            .eq('id', groupId)

        if (updateError) throw updateError

        return memberIds
    },

    // 3. Update Session Members (Customization)
    async updateSessionMembers(groupId: string, memberIds: string[]) {
        const { error } = await supabase
            .from('groups')
            .update({ active_members: memberIds })
            .eq('id', groupId)

        if (error) throw error
    },

    // Helper: Get Group by ID
    async getGroup(groupId: string) {
        const { data, error } = await supabase
            .from('groups')
            .select('*')
            .eq('id', groupId)
            .single()

        if (error) throw error
        return data
    },

    // Helper: Get User's Group
    async getUserGroup(userId: string) {
        const { data, error } = await supabase
            .from('group_members')
            .select('group_id, groups(*)')
            .eq('user_id', userId)
            .single()

        if (error) return null
        // @ts-ignore
        return data.groups
    },

    // 1.6 Login with Google
    async loginWithGoogle() {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        })

        if (error) throw error
        return data
    },

    // Helper: Get All Users (for adding external members)
    async searchUsers(query: string) {
        // 1. Search internal users
        const { data: users, error: userError } = await supabase
            .from('users')
            .select('*')
            .ilike('name', `%${query}%`)
            .limit(5)

        if (userError) throw userError

        // 2. Search external staff
        const { data: externalStaff, error: externalError } = await supabase
            .from('external_staff')
            .select('*')
            .ilike('name', `%${query}%`)
            .limit(5)

        if (externalError) throw externalError

        // Combine results
        // Add a 'type' field to distinguish them if needed, or just return mixed
        const combined = [
            ...(users || []).map(u => ({ ...u, type: 'internal' })),
            ...(externalStaff || []).map(e => ({ ...e, type: 'external' }))
        ]

        return combined
    }
}
