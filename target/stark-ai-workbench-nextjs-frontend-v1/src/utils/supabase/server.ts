// src/utils/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = async () => {
  const cookieStore = (await cookies()) as any
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ""
  const secure = siteUrl.startsWith("https://")

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            // Ensure proper cookie security settings for production
            const cookieOptions = {
              ...options,
              secure,
              sameSite: 'lax' as const,
              httpOnly: false, // Supabase needs client access
            }
            cookieStore.set({ name, value, ...cookieOptions })
          } catch (error) {
            // The `set` method was called from a Server Component.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            const cookieOptions = {
              ...options,
              secure,
              sameSite: 'lax' as const,
            }
            cookieStore.delete({ name, ...cookieOptions })
          } catch (error) {
            // The `delete` method was called from a Server Component.
          }
        },
      },
    }
  )
}