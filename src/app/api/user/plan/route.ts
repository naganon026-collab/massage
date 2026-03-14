import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { canGenerate } from "@/lib/subscription";

export async function GET() {
    const authResult = await requireAuth();
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const status = await canGenerate(user.id);
    return NextResponse.json(status);
}
