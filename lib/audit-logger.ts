import { supabase } from './supabase'

export type AuditAction =
    | 'UPDATE_SHIFT_PATTERN'
    | 'MOVE_WORKER'
    | 'CREATE_WORKER'
    | 'DELETE_WORKER'
    | 'UPDATE_WORKER'
    | 'LOGIN'
    | 'LOGOUT'

export type TargetType =
    | 'SHIFT_CONFIG'
    | 'USER'
    | 'GROUP'
    | 'AUTH'

export interface AuditLogEntry {
    action: AuditAction
    target_type: TargetType
    target_id?: string
    changes?: Record<string, any>
    user_id?: string // Optional, will try to get from session if not provided
}

export const auditLogger = {
    async log(entry: AuditLogEntry) {
        try {
            let userId = entry.user_id

            // If user_id is not provided, try to get it from the current session
            if (!userId) {
                const { data: { session } } = await supabase.auth.getSession()
                userId = session?.user?.id
            }

            // If still no user_id (e.g., system action or anonymous), we might want to record it as system
            // But for now, we'll just proceed. The DB allows null user_id.

            const { error } = await supabase
                .from('audit_logs')
                .insert({
                    user_id: userId,
                    action: entry.action,
                    target_type: entry.target_type,
                    target_id: entry.target_id,
                    changes: entry.changes
                })

            if (error) {
                console.error('Failed to insert audit log:', error)
            }
        } catch (err) {
            console.error('Error in auditLogger:', err)
        }
    }
}
