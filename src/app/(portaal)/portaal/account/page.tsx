import { KeyRound, Mail, Phone, Globe } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { buttonClass } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DefinitionList, PageHeader } from "@/components/ui/misc";
import { requireClient } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Account" };

/** Accountpagina in het klantportaal (§31). */
export default async function PortalAccountPage() {
  const user = await requireClient();
  const supabase = await createClient();

  const [{ data: company }, { data: link }] = await Promise.all([
    supabase
      .from("companies")
      .select(
        "name, email, phone, website, address_line, postal_code, city, account_manager:users!companies_account_manager_id_fkey(full_name, email)",
      )
      .eq("id", user.companyId)
      .maybeSingle(),
    supabase
      .from("customer_users")
      .select("contact:contacts(full_name, email, phone, job_title)")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const manager = Array.isArray(company?.account_manager)
    ? company?.account_manager[0]
    : company?.account_manager;
  const contact = Array.isArray(link?.contact) ? link?.contact[0] : link?.contact;

  return (
    <>
      <PageHeader title="Account" description="Uw gegevens en contactpersoon bij ons." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Uw account" />
          <CardBody className="space-y-5">
            <DefinitionList
              className="sm:grid-cols-1"
              items={[
                { label: "Naam", value: user.fullName },
                { label: "E-mailadres", value: user.email },
                {
                  label: "Functie",
                  value: (contact as { job_title?: string } | null)?.job_title ?? "—",
                },
                {
                  label: "Telefoonnummer",
                  value: (contact as { phone?: string } | null)?.phone ?? "—",
                },
              ]}
            />

            <div className="rounded-[var(--radius)] border border-border bg-surface-muted/40 px-3.5 py-3">
              <p className="text-[13px] font-medium text-foreground">Wachtwoord wijzigen</p>
              <p className="mt-1 text-xs text-muted-foreground">
                U ontvangt een e-mail met een link om een nieuw wachtwoord in te stellen.
              </p>
              <Link
                href="/wachtwoord-vergeten"
                className={buttonClass("secondary", "sm", "mt-3")}
              >
                <KeyRound className="h-3.5 w-3.5" />
                Nieuw wachtwoord instellen
              </Link>
            </div>

            <p className="text-xs text-muted-foreground">
              Kloppen uw gegevens niet? Geef het door aan uw projectmanager, dan passen
              wij het aan.
            </p>
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Uw organisatie" />
            <CardBody>
              <DefinitionList
                className="sm:grid-cols-1"
                items={[
                  { label: "Bedrijfsnaam", value: company?.name ?? "—" },
                  {
                    label: "E-mailadres",
                    value: company?.email ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        {company.email}
                      </span>
                    ) : (
                      "—"
                    ),
                  },
                  {
                    label: "Telefoonnummer",
                    value: company?.phone ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        {company.phone}
                      </span>
                    ) : (
                      "—"
                    ),
                  },
                  {
                    label: "Website",
                    value: company?.website ? (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1.5 text-accent hover:underline"
                      >
                        <Globe className="h-3.5 w-3.5" />
                        {company.website.replace(/^https?:\/\//, "")}
                      </a>
                    ) : (
                      "—"
                    ),
                  },
                  {
                    label: "Adres",
                    value: company?.address_line
                      ? `${company.address_line}, ${company.postal_code ?? ""} ${company.city ?? ""}`.trim()
                      : "—",
                  },
                ]}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Uw contactpersoon bij ons" />
            <CardBody>
              {manager ? (
                <DefinitionList
                  className="sm:grid-cols-1"
                  items={[
                    {
                      label: "Projectmanager",
                      value: (manager as { full_name?: string }).full_name ?? "—",
                    },
                    {
                      label: "E-mailadres",
                      value: (manager as { email?: string }).email ? (
                        <a
                          href={`mailto:${(manager as { email: string }).email}`}
                          className="text-accent hover:underline"
                        >
                          {(manager as { email: string }).email}
                        </a>
                      ) : (
                        "—"
                      ),
                    },
                  ]}
                />
              ) : (
                <p className="text-[13px] text-muted-foreground">
                  Er is nog geen vaste contactpersoon toegewezen.
                </p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
