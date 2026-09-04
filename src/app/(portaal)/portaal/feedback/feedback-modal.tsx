"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { submitFeedbackAction } from "../../actions";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/field";
import { Modal, SubmitButton } from "@/components/ui/modal";
import { FEEDBACK_TYPE, PRIORITY, options } from "@/lib/labels";
import { useActionForm } from "@/lib/use-action-form";

/**
 * Feedback indienen vanuit het klantportaal (§26).
 *
 * Na verzending verschijnt het punt automatisch bij het juiste interne project
 * en krijgt het team er een notificatie van.
 */
export function FeedbackModal({
  projects,
  defaultProjectId,
}: {
  projects: { id: string; name: string }[];
  defaultProjectId?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const { submit, pending, error } = useActionForm(submitFeedbackAction, (result) => {
    toast.success(result.success ?? "Bedankt voor uw feedback.");
    setOpen(false);
    if (result.id) router.push(`/portaal/feedback/${result.id}`);
    else router.refresh();
  });

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Feedback toevoegen
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Feedback toevoegen"
        description="Laat weten wat er beter kan. Wij pakken het op en houden u op de hoogte."
        size="lg"
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setOpen(false)}>
              Annuleren
            </Button>
            <SubmitButton form="portal-feedback" pending={pending} pendingLabel="Versturen…">
              Versturen
            </SubmitButton>
          </>
        }
      >
        <form id="portal-feedback" action={submit} className="space-y-4">
          <FormError>{error}</FormError>

          <Field label="Project" htmlFor="pf_project" required>
            <Select
              id="pf_project"
              name="project_id"
              required
              defaultValue={defaultProjectId ?? (projects.length === 1 ? projects[0].id : "")}
            >
              <option value="">Kies een project…</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Onderwerp" htmlFor="pf_title" required>
            <Input
              id="pf_title"
              name="title"
              required
              minLength={2}
              placeholder="Knop op de bevestigingspagina werkt niet"
            />
          </Field>

          <Field
            label="Omschrijving"
            htmlFor="pf_description"
            required
            hint="Hoe uitgebreider, hoe sneller we het kunnen oppakken."
          >
            <Textarea
              id="pf_description"
              name="description"
              rows={5}
              required
              placeholder="Wat gebeurt er precies, en wanneer?"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type feedback" htmlFor="pf_type">
              <Select id="pf_type" name="type" defaultValue="general">
                {options(FEEDBACK_TYPE).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Prioriteit" htmlFor="pf_priority">
              <Select id="pf_priority" name="priority" defaultValue="normal">
                {options(PRIORITY).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <p className="text-xs text-muted-foreground">
            Een screenshot toevoegen kan nadat u de feedback heeft verstuurd.
          </p>
        </form>
      </Modal>
    </>
  );
}
