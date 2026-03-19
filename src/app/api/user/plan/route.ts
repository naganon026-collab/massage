import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { canGenerate, canGenerateBlog, getTotalGenerationCount } from "@/lib/subscription";

export async function GET() {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [status, blogAllowed, totalGenerations] = await Promise.all([
        canGenerate(user.id),
        canGenerateBlog(user.id),
        getTotalGenerationCount(user.id),
    ]);
    const isPracticeMode = totalGenerations === 0;
    return NextResponse.json({ ...status, canGenerateBlog: blogAllowed, isPracticeMode });
}
