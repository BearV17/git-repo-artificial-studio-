import { Bell, KeyRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ProfileForm } from "./profile-form";
import { buttonClass } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DefinitionList, PageHeader } from "@/components/ui/misc";
import { requireInternal } from "@/lib/auth";
import { USER_ROLE } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";

export const metadata: Metadata = { title: "Mijn account" };

/**
 * Accountpagina voor het interne team (§3).
 *
 * Klanten hebben er al een onder /portaal/account; developers, freelancers,
 * projectmanagers en admins hadden nog geen plek om hun eigen gegevens te zien
 * of aan te passen.
 */
export default async function AccountPage() {
  const user = await requireInternal();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("users")
    .select("job_title, phone, created_at, last_seen_at")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <>
      <PageHeader
        title="Mijn account"
        description="Je eigen gegevens. Rol en toegang worden door een beheerder ingesteld."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Gegevens"
            description="Deze naam zien collega's bij taken, reacties en updates."
          />
          <CardBody>
            <ProfileForm
              fullName={user.fullName}
              jobTitle={profile?.job_title ?? null}
              phone={profile?.phone ?? null}
            />
          </CardBody>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Toegang" />
            <CardBody className="space-y-5">
              <DefinitionList
                className="sm:grid-cols-1"
                items={[
                  { label: "E-mailadres", value: user.email },
                  { label: "Rol", value: USER_ROLE[user.role].label },
                  {
                    label: "Account sinds",
                    value: profile?.created_at ? formatDateTime(profile.created_at) : "—",
                  },
                  {
                    label: "Laatst actief",
                    value: profile?.last_seen_at
                      ? formatDateTime(profile.last_seen_at)
                      : "—",
                  },
                ]}
              />

              <p className="text-xs text-muted-foreground">
                Een ander e-mailadres of een andere rol regelt een beheerder via Team.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Beveiliging en meldingen" />
            <CardBody className="space-y-3">
              <div className="rounded-[var(--radius)] border border-border bg-surface-muted/40 px-3.5 py-3">
                <p className="text-[13px] font-medium text-foreground">
                  Wachtwoord wijzigen
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Je ontvangt een e-mail met een link om een nieuw wachtwoord te kiezen.
                </p>
                <Link
                  href="/wachtwoord-vergeten"
                  className={buttonClass("secondary", "sm", "mt-3")}
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Nieuw wachtwoord instellen
                </Link>
              </div>

              <div className="rounded-[var(--radius)] border border-border bg-surface-muted/40 px-3.5 py-3">
                <p className="text-[13px] font-medium text-foreground">
                  E-mailnotificaties
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Bepaal zelf waarover je bericht krijgt.
                </p>
                <Link
                  href="/instellingen/notificaties"
                  className={buttonClass("secondary", "sm", "mt-3")}
                >
                  <Bell className="h-3.5 w-3.5" />
                  Voorkeuren aanpassen
                </Link>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
