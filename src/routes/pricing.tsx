import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import {
  createPricing,
  deletePricing,
  fetchPricing,
  updatePricing,
  type ModelPricing,
} from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, X } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Token Estimator" },
      { name: "description", content: "Manage per-token input and output pricing for LLM models." },
    ],
  }),
  component: PricingPage,
});

type FormState = {
  id: number | null;
  model_name: string;
  input_price: string;
  output_price: string;
};
const empty: FormState = { id: null, model_name: "", input_price: "", output_price: "" };

function PricingPage() {
  const qc = useQueryClient();
  const pricing = useQuery({ queryKey: ["pricing"], queryFn: fetchPricing });
  const [form, setForm] = useState<FormState>(empty);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["pricing"] });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        model_name: form.model_name.trim(),
        input_price: Number(form.input_price),
        output_price: Number(form.output_price),
      };
      if (form.id) return updatePricing(form.id, payload);
      return createPricing(payload);
    },
    onSuccess: () => {
      toast.success(form.id ? "Model updated" : "Model added");
      setForm(empty);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "Failed to save"),
  });

  const remove = useMutation({
    mutationFn: deletePricing,
    onSuccess: () => {
      toast.success("Model deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message || "Failed to delete"),
  });

  const edit = (m: ModelPricing) =>
    setForm({
      id: m.id,
      model_name: m.model_name,
      input_price: String(m.input_price),
      output_price: String(m.output_price),
    });

  return (
    <AppShell>
      <div className="space-y-8">
        <header>
          <p className="text-xs uppercase tracking-wider text-primary/80 font-medium mb-2">
            Pricing
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-gradient">
            Model pricing console
          </h1>
          <p className="text-muted-foreground mt-2">
            Define the per-token input and output price for every model you want to estimate.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
          <section className="card-elevated p-6 h-fit">
            <h2 className="font-semibold">
              {form.id ? "Edit model" : "Add new model"}
            </h2>
            <p className="text-xs text-muted-foreground mt-1 mb-5">
              Prices are per single token (USD).
            </p>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate();
              }}
            >
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Model name</Label>
                <Input
                  required
                  value={form.model_name}
                  onChange={(e) => setForm({ ...form, model_name: e.target.value })}
                  className="bg-input border-border"
                  placeholder="gpt-5-mini"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Input price (per token)</Label>
                <Input
                  required
                  type="number"
                  step="0.00000001"
                  value={form.input_price}
                  onChange={(e) => setForm({ ...form, input_price: e.target.value })}
                  className="bg-input border-border number-mono"
                  placeholder="0.00000025"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Output price (per token)</Label>
                <Input
                  required
                  type="number"
                  step="0.00000001"
                  value={form.output_price}
                  onChange={(e) => setForm({ ...form, output_price: e.target.value })}
                  className="bg-input border-border number-mono"
                  placeholder="0.000002"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={save.isPending}>
                  {form.id ? "Update model" : "Add model"}
                </Button>
                {form.id && (
                  <Button type="button" variant="ghost" onClick={() => setForm(empty)}>
                    <X className="size-4 mr-1" /> Cancel
                  </Button>
                )}
              </div>
            </form>
          </section>

          <section className="card-elevated overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold">Available models</h2>
              <span className="text-xs text-muted-foreground">
                {pricing.data?.length ?? 0} model(s)
              </span>
            </div>
            {pricing.data && pricing.data.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Model</TableHead>
                    <TableHead className="text-right">Input / token</TableHead>
                    <TableHead className="text-right">Output / token</TableHead>
                    <TableHead className="w-32"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pricing.data.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.model_name}</TableCell>
                      <TableCell className="text-right number-mono">
                        ${Number(m.input_price).toFixed(8)}
                      </TableCell>
                      <TableCell className="text-right number-mono">
                        ${Number(m.output_price).toFixed(8)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => edit(m)}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm(`Delete pricing for ${m.model_name}?`))
                                remove.mutate(m.id);
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
                No models yet. Add one on the left to get started.
              </div>
            )}
          </section>
        </div>
      </div>
    </AppShell>
  );
}
