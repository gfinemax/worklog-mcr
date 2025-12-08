// Supabase Types
// This file is a placeholder for generated Supabase types
// Run `npx supabase gen types typescript` to generate actual types

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: Record<string, unknown>
        Views: Record<string, unknown>
        Functions: Record<string, unknown>
        Enums: Record<string, unknown>
    }
}
