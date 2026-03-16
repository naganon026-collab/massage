import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LateCallbackPage({
    searchParams,
}: {
    searchParams: Promise<{ connected?: string; profileId?: string; profile_id?: string; accountId?: string; account_id?: string; locationId?: string; location_id?: string; username?: string }>;
}) {
    const params = await searchParams;
    const connected = params.connected;
    const profileId = params.profileId ?? params.profile_id;
    const accountId = params.accountId ?? params.account_id ?? params.locationId ?? params.location_id;

    if (!connected || !accountId) {
        redirect(`/?late=error&reason=${!connected ? "no_platform" : "no_account"}`);
    }

    const platform = connected.toLowerCase();
    const platformKey =
        platform === "googlebusiness" || platform === "gmb" || platform === "google"
            ? "googlebusiness"
            : platform === "instagram"
                ? "instagram"
                : null;
    if (!platformKey) {
        redirect(`/?late=error&reason=unknown_platform&connected=${encodeURIComponent(connected)}`);
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/?late=error&reason=no_session");

    const { data: existing } = await supabase
        .from("shop_integrations")
        .select("access_token")
        .eq("user_id", user.id)
        .eq("platform", "late")
        .maybeSingle();

    let payload: { profileId: string; accountIds: { instagram: string | null; googlebusiness: string | null } };
    if (existing?.access_token) {
        try {
            payload = JSON.parse(existing.access_token);
        } catch {
            payload = { profileId: profileId || "", accountIds: { instagram: null, googlebusiness: null } };
        }
    } else {
        payload = { profileId: profileId || "", accountIds: { instagram: null, googlebusiness: null } };
    }

    if (profileId) payload.profileId = profileId;
    else if (!payload.profileId) redirect("/?late=error&reason=no_profile");
    payload.accountIds[platformKey] = accountId;

    const { error } = await supabase
        .from("shop_integrations")
        .upsert(
            {
                user_id: user.id,
                platform: "late",
                access_token: JSON.stringify(payload),
                updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,platform" }
        );

    if (error) redirect(`/?late=error&reason=db&msg=${encodeURIComponent(error.message)}`);

    redirect("/?late=connected");
}
