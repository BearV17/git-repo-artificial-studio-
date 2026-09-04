"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { firstIssue, text } from "@/lib/validation";

export interface PortalState {
  error?: string;
  success?: string;
  id?: string;
}

const FEEDBACK_TYPES = ["change", "bug", "feature_request", "general", "other"] as const;
const PRIORITIES = ["low", "normal", "high", "urgent"] as const;

/**
 * Controleert dat het gekozen project bij de eigen organisatie hoort.
 *
 * De RLS-policy weigert dit ook, maar dan met een generieke databasefout. Door
 * het hier af te vangen krijgt de klant een begrijpelijke melding.
 */
async function assertOwnProject(projectId: string, companyId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("company_id", companyId)
    .maybeSingle();
  return Boolean(data);
}

// -----------------------------------------------------------------------------
// Feedback indienen (§26)
// -----------------------------------------------------------------------------
const feedbackSchema = z.object({
  project_id: z.uuid("Kies een project."),
  title: z.string().trim().min(2, "Vul een onderwerp in."),
  description: z.string().trim().min(1, "Beschrijf kort waar het om gaat."),
  type: z.enum(FEEDBACK_TYPES),
  priority: z.enum(PRIORITIES),
});

export async function submitFeedbackAction(
  _prev: PortalState,
  formData: FormData,
): Promise<PortalState> {
  const user = await requireClient();

  const parsed = feedbackSchema.safeParse({
    project_id: text(formData.get("project_id")),
    title: text(formData.get("title")),
    description: text(formData.get("description")),
    type: text(formData.get("type")) || "general",
    priority: text(formData.get("priority")) || "normal",
  });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  if (!(await assertOwnProject(parsed.data.project_id, user.companyId))) {
    return { error: "Dit project hoort niet bij uw organisatie." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feedback")
    .insert({
      ...parsed.data,
      company_id: user.companyId,
      submitted_by: user.id,
      status: "new",
    })
    .select("id")
    .single();

  if (error) return { error: "Uw feedback kon niet worden verstuurd. Probeer het opnieuw." };

  revalidatePath("/portaal/feedback");
  revalidatePath("/portaal");
  return { success: "Bedankt, uw feedback is ontvangen.", id: data.id };
}

// -----------------------------------------------------------------------------
// Vraag stellen (§27)
// -----------------------------------------------------------------------------
const questionSchema = z.object({
  project_id: z.uuid("Kies een project."),
  subject: z.string().trim().min(2, "Vul een onderwerp in."),
  body: z.string().trim().min(1, "Stel uw vraag."),
});

export async function askQuestionAction(
  _prev: PortalState,
  formData: FormData,
): Promise<PortalState> {
  const user = await requireClient();

  const parsed = questionSchema.safeParse({
    project_id: text(formData.get("project_id")),
    subject: text(formData.get("subject")),
    body: text(formData.get("body")),
  });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  if (!(await assertOwnProject(parsed.data.project_id, user.companyId))) {
    return { error: "Dit project hoort niet bij uw organisatie." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_questions")
    .insert({
      ...parsed.data,
      company_id: user.companyId,
      asked_by: user.id,
      status: "new",
    })
    .select("id")
    .single();

  if (error) return { error: "Uw vraag kon niet worden verstuurd. Probeer het opnieuw." };

  revalidatePath("/portaal/vragen");
  revalidatePath("/portaal");
  return { success: "Bedankt, uw vraag is verstuurd.", id: data.id };
}

// -----------------------------------------------------------------------------
// Actie afronden (§28)
// -----------------------------------------------------------------------------
export async function setActionStatusAction(actionId: string, status: string) {
  await requireClient();

  if (!["open", "in_progress", "done"].includes(status)) {
    return { error: "Onbekende status." };
  }

  const supabase = await createClient();

  // De trigger `guard_customer_action_client_update` zorgt ervoor dat een klant
  // uitsluitend de status kan wijzigen; alle andere kolommen zijn geblokkeerd.
  const { data, error } = await supabase
    .from("customer_actions")
    .update({ status })
    .eq("id", actionId)
    .select("id")
    .maybeSingle();

  if (error || !data) return { error: "Deze actie kon niet worden bijgewerkt." };

  revalidatePath("/portaal/acties");
  revalidatePath("/portaal");
  return { success: "Bijgewerkt." };
}
