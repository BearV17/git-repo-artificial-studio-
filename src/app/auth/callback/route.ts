import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Landingspunt voor alle links uit Supabase-mails: uitnodiging, activatie,
 * wachtwoord-reset en e-mailbevestiging (§3).
 *
 * Supabase stuurt afhankelijk van de instellingen ofwel `code` (PKCE) ofwel
 * `token_hash` + `type`. Beide worden hier afgehandeld.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next");

  const supabase = await createClient();
  let ok = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  }

  if (!ok) {
    return NextResponse.redirect(`${origin}/login?fout=verlopen`);
  }

  // Een uitnodiging of herstelmail leidt altijd eerst naar het instellen van
  // een eigen wachtwoord.
  const target =
    next && next.startsWith("/")
      ? next
      : type === "recovery" || type === "invite"
        ? "/wachtwoord-resetten"
        : "/";

  return NextResponse.redirect(`${origin}${target}`);
}
