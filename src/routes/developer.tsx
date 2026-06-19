import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import {
  createApplication,
  createService,
  deleteApplication,
  deleteService,
  fetchApplications,
  updateService,
  type Application,
  type Service,
} from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/developer")({
  head: () => ({
    meta: [
      { title: "Developer — Token Estimator" },
      {
        name: "description",
        content: "Manage applications and the services that consume LLM tokens within them.",
      },
    ],
  }),
  component: DeveloperPage,
});

type ServiceForm = {
  id: number | null;
  name: string;
  input_words: string;
  output_words: string;
};
const emptyService: ServiceForm = { id: null, name: "", input_words: "", output_words: "" };

function DeveloperPage() {
  const qc = useQueryClient();
  const apps = useQuery({ queryKey: ["applications"], queryFn: fetchApplications });

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [appForm, setAppForm] = useState({ name: "", description: "" });
  const [svcForm, setSvcForm] = useState<ServiceForm>(emptyService);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["applications"] });
  const selected: Application | undefined = apps.data?.find((a) => a.id === selectedId);

  const createApp = useMutation({
    mutationFn: () => createApplication(appForm),
    onSuccess: (a) => {
      toast.success("Application created");
      setAppForm({ name: "", description: "" });
      setSelectedId((a as { id: number }).id);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "Failed"),
  });

  const removeApp = useMutation({
    mutationFn: deleteApplication,
    onSuccess: () => {
      toast.success("Application deleted");
      setSelectedId(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "Failed"),
  });

  const saveService = useMutation({
    mutationFn: () => {
      if (!selected) throw new Error("Select an app first");
      const payload = {
        name: svcForm.name.trim(),
        input_words: Number(svcForm.input_words),
        output_words: Number(svcForm.output_words),
      };
      if (svcForm.id) return updateService(svcForm.id, payload);
      return createService({ app_id: selected.id, ...payload });
    },
    onSuccess: () => {
      toast.success(svcForm.id ? "Service updated" : "Service added");
      setSvcForm(emptyService);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "Failed"),
  });

  const removeService = useMutation({
    mutationFn: deleteService,
    onSuccess: () => {
      toast.success("Service deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "Failed"),
  });

  const editService = (s: Service) =>
    setSvcForm({
      id: s.id,
      name: s.name,
      input_words: String(s.input_words),
      output_words: String(s.output_words),
    });

  const ratioPreview =
    svcForm.input_words && svcForm.output_words && Number(svcForm.input_words) > 0
      ? (Number(svcForm.output_words) / Number(svcForm.input_words)).toFixed(4)
      : null;

  return (
    <AppShell>
      <div className="space-y-8">
        <header>
          <p className="text-xs uppercase tracking-wider text-primary/80 font-medium mb-2">
            Developer
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-gradient">
            Applications & services
          </h1>
          <p className="text-muted-foreground mt-2">
            Define the applications you bill for and the services inside each — their average
            input/output word counts drive the calculator.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          {/* Left column */}
          <div className="space-y-6">
            <section className="card-elevated p-6">
              <h2 className="font-semibold">New application</h2>
              <form
                className="mt-4 space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  createApp.mutate();
                }}
              >
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <Input
                    required
                    value={appForm.name}
                    onChange={(e) => setAppForm({ ...appForm, name: e.target.value })}
                    className="bg-input border-border"
                    placeholder="Customer Support Bot"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Textarea
                    rows={3}
                    value={appForm.description}
                    onChange={(e) => setAppForm({ ...appForm, description: e.target.value })}
                    className="bg-input border-border resize-none"
                    placeholder="What this app does…"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createApp.isPending}>
                  <Plus className="size-4 mr-1" /> Create application
                </Button>
              </form>
            </section>

            <section className="card-elevated p-4">
              <div className="px-2 pt-1 pb-3 text-xs uppercase tracking-wider text-muted-foreground">
                Your applications
              </div>
              {apps.data && apps.data.length > 0 ? (
                <div className="space-y-1">
                  {apps.data.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => {
                        setSelectedId(a.id);
                        setSvcForm(emptyService);
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-lg border transition-colors",
                        selectedId === a.id
                          ? "border-primary/40 bg-primary/10"
                          : "border-transparent hover:bg-accent",
                      )}
                    >
                      <div className="font-medium text-sm">{a.name}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {a.services.length} service(s)
                        {a.description ? ` · ${a.description.slice(0, 40)}` : ""}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-3 py-8 text-center text-xs text-muted-foreground">
                  No applications yet.
                </div>
              )}
            </section>
          </div>

          {/* Right column */}
          {selected ? (
            <div className="space-y-6 min-w-0">
              <section className="card-elevated p-6 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">{selected.name}</h2>
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground number-mono">
                      ID {selected.id}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selected.description || "No description provided."}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => {
                    if (
                      confirm(
                        `Delete "${selected.name}" and all its services? This cannot be undone.`,
                      )
                    )
                      removeApp.mutate(selected.id);
                  }}
                >
                  <Trash2 className="size-4 mr-1" />
                  Delete app
                </Button>
              </section>

              <section className="card-elevated p-6">
                <h3 className="font-semibold">
                  {svcForm.id ? "Edit service" : "Add service"}
                </h3>
                <form
                  className="mt-4 space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveService.mutate();
                  }}
                >
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Service name</Label>
                    <Input
                      required
                      value={svcForm.name}
                      onChange={(e) => setSvcForm({ ...svcForm, name: e.target.value })}
                      className="bg-input border-border"
                      placeholder="Summarize ticket"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Avg. input word count
                      </Label>
                      <Input
                        required
                        type="number"
                        min={0}
                        value={svcForm.input_words}
                        onChange={(e) =>
                          setSvcForm({ ...svcForm, input_words: e.target.value })
                        }
                        className="bg-input border-border number-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        Avg. output word count
                      </Label>
                      <Input
                        required
                        type="number"
                        min={0}
                        value={svcForm.output_words}
                        onChange={(e) =>
                          setSvcForm({ ...svcForm, output_words: e.target.value })
                        }
                        className="bg-input border-border number-mono"
                      />
                    </div>
                  </div>
                  {ratioPreview && (
                    <div className="text-xs text-muted-foreground">
                      Output / input ratio:{" "}
                      <span className="text-primary number-mono font-medium">{ratioPreview}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button type="submit" disabled={saveService.isPending}>
                      {svcForm.id ? "Update service" : "Add service"}
                    </Button>
                    {svcForm.id && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setSvcForm(emptyService)}
                      >
                        <X className="size-4 mr-1" /> Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </section>

              <section className="card-elevated overflow-hidden">
                <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold">Services</h3>
                  <span className="text-xs text-muted-foreground">
                    {selected.services.length} configured
                  </span>
                </div>
                {selected.services.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Input words</TableHead>
                        <TableHead className="text-right">Output words</TableHead>
                        <TableHead className="text-right">Ratio</TableHead>
                        <TableHead className="w-28"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selected.services.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.name}</TableCell>
                          <TableCell className="text-right number-mono">
                            {s.input_words}
                          </TableCell>
                          <TableCell className="text-right number-mono">
                            {s.output_words}
                          </TableCell>
                          <TableCell className="text-right number-mono text-primary">
                            {s.ratio.toFixed(4)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => editService(s)}
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  if (confirm(`Delete service "${s.name}"?`))
                                    removeService.mutate(s.id);
                                }}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-10 text-center text-sm text-muted-foreground">
                    No services added yet.
                  </div>
                )}
              </section>
            </div>
          ) : (
            <section className="card-elevated p-16 text-center text-sm text-muted-foreground">
              Select an application on the left to manage its services.
            </section>
          )}
        </div>
      </div>
    </AppShell>
  );
}
