import { z } from "zod";

/**
 * Gedeelde bouwstenen voor formuliervalidatie.
 * Lege formuliervelden komen binnen als "" en horen in de database als NULL.
 */

export const optionalText = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable();

export const optionalEmail = optionalText.refine(
  (value) => value === null || z.email().safeParse(value).success,
  { message: "Vul een geldig e-mailadres in." },
);

export const optionalDate = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .refine((value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: "Vul een geldige datum in.",
  });

export const optionalUuid = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .nullable()
  .refine((value) => value === null || z.uuid().safeParse(value).success, {
    message: "Ongeldige selectie.",
  });

/** Eerste leesbare foutmelding uit een mislukte parse. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Controleer de ingevulde gegevens.";
}

export function checkbox(value: FormDataEntryValue | null): boolean {
  return value === "on" || value === "true" || value === "1";
}

export function text(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value : "";
}
