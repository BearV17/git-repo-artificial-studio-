"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { firstIssue, optionalText, text } from "@/lib/validation";

export interface ProfileState {
  error?: string;
  success?: string;
}

/**
 * Eigen profiel bijwerken (§3).
 *
 * Rol, e-mailadres en actief-status staan hier bewust niet bij: die horen bij
 * teambeheer. De trigger `guard_user_self_update` blokkeert ze ook in de
 * database, mocht er ooit langs een andere weg een poging worden gedaan.
 */
const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Vul je naam in."),
  job_title: optionalText,
  phone: optionalText,
});

export async function updateOwnProfileAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await requireUser();

  const parsed = profileSchema.safeParse({
    full_name: text(formData.get("full_name")),
    job_title: text(formData.get("job_title")),
    phone: text(formData.get("phone")),
  });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("users").update(parsed.data).eq("id", user.id);

  if (error) return { error: "Je gegevens konden niet worden opgeslagen." };

  // De naam staat ook in de zijbalk, die in de layout van beide omgevingen zit.
  revalidatePath("/account");
  revalidatePath("/dashboard");
  revalidatePath("/team");
  return { success: "Gegevens opgeslagen." };
}
