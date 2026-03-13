import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// モジュールレベルでインスタンスをキャッシュし、毎レンダリングでの再生成を防ぐ
let cachedClient: SupabaseClient | null = null

export function createClient() {
    if (cachedClient) return cachedClient
    cachedClient = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    return cachedClient
}
