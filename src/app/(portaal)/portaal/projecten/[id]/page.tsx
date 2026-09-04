import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProjectTimeline } from "@/components/domain/project-timeline";
import { StatusBadge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { DefinitionList, EmptyState, PageHeader, Progress } from "@/components/ui/misc";
import { requireClient } from "@/lib/auth";
import { PROJECT_STATUS } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import type { ProjectPhase, ProjectStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select("name").eq("id", id).maybeSingle();
  return { title: data?.name ?? "Project" };
}

/** Projectdetail in het klantportaal (§24) — bewust zonder technische details. */
export default async function PortalProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireClient();
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select(
      "id, name, description, status, progress, start_date, deadline, next_step, project_manager:users!projects_project_manager_id_fkey(full_name, email)",
    )
    .eq("id", id)
    .maybeSingle();

  if (!project) notFound();

  const [{ data: phases }, { data: updates }] = await Promise.all([
    supabase.from("project_phases").select("*").eq("project_id", id).order("position"),
    supabase
      .from("project_updates")
      .select("id, title, body, published_at")
      .eq("project_id", id)
      .order("published_at", { ascending: false })
      .limit(20),
  ]);

  const manager = Array.isArray(project.project_manager)
    ? project.project_manager[0]
    : project.project_manager;

  return (
    <>
      <PageHeader
        breadcrumb={[
          { label: "Projecten", href: "/portaal/projecten" },
          { label: project.name },
        ]}
        title={project.name}
        action={
          <StatusBadge
            map={PROJECT_STATUS}
            value={project.status as ProjectStatus}
            variant="clientLabel"
          />
        }
      />

      <Card>
        <CardBody className="space-y-5">
          <Progress value={project.progress} />

          {project.description ? (
            <p className="whitespace-pre-wrap text-sm">{project.description}</p>
          ) : null}

          <DefinitionList
            items={[
              {
                label: "Eerstvolgende stap",
                value: project.next_step || "Wordt binnenkort bepaald",
              },
              { label: "Gestart op", value: formatDate(project.start_date) },
              {
                label: "Verwachte oplevering",
                value: formatDate(project.deadline),
              },
              {
                label: "Uw projectmanager",
                value:
                  (manager as { full_name?: string } | null)?.full_name ?? "—",
              },
            ]}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Tijdlijn" description="Waar staan we in het traject?" />
        <CardBody className="pt-6 pb-7">
          <ProjectTimeline
            status={project.status as ProjectStatus}
            phases={(phases ?? []) as ProjectPhase[]}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Updates" description="Nieuwste bericht bovenaan." />
        {(updates ?? []).length === 0 ? (
          <EmptyState
            title="Nog geen updates"
            description="Zodra er nieuws is over dit project, leest u het hier."
          />
        ) : (
          <ul className="divide-y divide-border">
            {(updates ?? []).map((update) => (
              <li key={update.id} className="px-5 py-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[13px] font-medium">{update.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(update.published_at)}
                  </p>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-[13px] text-muted-foreground">
                  {update.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
