import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAIL } from "@/types";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    let next = searchParams.get("next") ?? "/";
    if (!next.startsWith("/")) next = "/";

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            const { data: { user } } = await supabase.auth.getUser();
            const isAdmin = user?.email === ADMIN_EMAIL;
            const redirectTo = isAdmin ? "/admin" : next;

            const forwardedHost = request.headers.get("x-forwarded-host");
            const isLocalEnv = process.env.NODE_ENV === "development";
            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${redirectTo}`);
            }
            if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${redirectTo}`);
            }
            return NextResponse.redirect(`${origin}${redirectTo}`);
        }
    }

    return NextResponse.redirect(`${origin}/?error=auth-error`);
}
