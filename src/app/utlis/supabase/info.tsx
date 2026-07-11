export const projectId = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0] || 'vyvjfuxofwwphewceffd'
export const publicAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''