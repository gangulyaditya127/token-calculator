import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  fetchApplications,
  fetchPricing,
  TOKEN_WORD_RATIO,
  type Application,
  type ModelPricing,
} from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Coins, Zap, Wallet, Download } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Calculator — Token Estimator" },
      {
        name: "description",
        content: "Estimate LLM token usage and cost for your applications.",
      },
    ],
  }),
  component: CalculatorPage,
});

function CalculatorPage() {
  const apps = useQuery({ queryKey: ["applications"], queryFn: fetchApplications });
  const pricing = useQuery({ queryKey: ["pricing"], queryFn: fetchPricing });

  const [selectedAppId, setSelectedAppId] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [numRequests, setNumRequests] = useState<number>(1);
  const [serviceInputs, setServiceInputs] = useState<Record<number, string>>({});
  const [showAllModels, setShowAllModels] = useState<boolean>(false);

  useEffect(() => {
    if (pricing.data && pricing.data.length > 0 && !selectedModel) {
      setSelectedModel(pricing.data[0].model_name);
    }
  }, [pricing.data, selectedModel]);

  const selectedApp: Application | undefined = useMemo(
    () => apps.data?.find((a) => a.id === Number(selectedAppId)),
    [apps.data, selectedAppId],
  );

  useEffect(() => {
    if (selectedApp) {
      const inputs: Record<number, string> = {};
      selectedApp.services.forEach((s) => {
        inputs[s.id] = String(s.input_words);
      });
      setServiceInputs(inputs);
    } else {
      setServiceInputs({});
    }
  }, [selectedApp]);

  const modelData: ModelPricing | undefined = pricing.data?.find(
    (m) => m.model_name === selectedModel,
  );

  const rows =
    selectedApp?.services.map((s) => {
      const inputWords = Number(serviceInputs[s.id]) || 0;
      const outputWords = inputWords * s.ratio;
      const inputTokens = inputWords * TOKEN_WORD_RATIO;
      const outputTokens = outputWords * TOKEN_WORD_RATIO;
      return { ...s, inputWords, outputWords, inputTokens, outputTokens };
    }) ?? [];

  const totals = rows.reduce(
    (acc, r) => {
      acc.inputTokens += r.inputTokens;
      acc.outputTokens += r.outputTokens;
      return acc;
    },
    { inputTokens: 0, outputTokens: 0 },
  );

  const totalInputTokens = totals.inputTokens * numRequests;
  const totalOutputTokens = totals.outputTokens * numRequests;
  const inputCost = modelData ? totalInputTokens * modelData.input_price : 0;
  const outputCost = modelData ? totalOutputTokens * modelData.output_price : 0;
  const totalCost = inputCost + outputCost;

  return (
    <AppShell>
      <div className="space-y-8">
        <header>
          <p className="text-xs uppercase tracking-wider text-primary/80 font-medium mb-2">
            Calculator
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-gradient">
            Estimate LLM token usage & cost
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Pick an application, choose a model, and tweak input word counts per service to
            instantly see projected token volume and spend.
          </p>
        </header>

        <section className="card-elevated p-6 grid gap-5 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Application</Label>
            <Select value={selectedAppId} onValueChange={setSelectedAppId}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Select application" />
              </SelectTrigger>
              <SelectContent>
                {apps.data?.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.name}
                  </SelectItem>
                ))}
                {apps.data?.length === 0 && (
                  <div className="px-3 py-2 text-xs text-muted-foreground">No apps yet</div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Model</Label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="bg-input border-border">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                {pricing.data?.map((m) => (
                  <SelectItem key={m.id} value={m.model_name}>
                    {m.model_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Number of requests</Label>
            <Input
              type="number"
              min={1}
              value={numRequests}
              onChange={(e) => setNumRequests(Number(e.target.value) || 1)}
              className="bg-input border-border number-mono"
            />
          </div>
        </section>

        {selectedApp ? (
          <>
            <section className="card-elevated">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div>
                  <h2 className="font-semibold">{selectedApp.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {selectedApp.services.length} service(s) · output = input × ratio
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  1 word ≈ {TOKEN_WORD_RATIO} tokens
                </div>
              </div>
              {rows.length === 0 ? (
                <div className="p-10 text-center text-sm text-muted-foreground">
                  No services configured for this application yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Service</TableHead>
                      <TableHead className="w-40">Input words</TableHead>
                      <TableHead className="text-right">Output words</TableHead>
                      <TableHead className="text-right">Input tokens</TableHead>
                      <TableHead className="text-right">Output tokens</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            value={serviceInputs[r.id] ?? ""}
                            onChange={(e) =>
                              setServiceInputs((prev) => ({
                                ...prev,
                                [r.id]: e.target.value,
                              }))
                            }
                            className="h-9 number-mono bg-input border-border"
                          />
                        </TableCell>
                        <TableCell className="text-right number-mono text-muted-foreground">
                          {r.outputWords.toFixed(0)}
                        </TableCell>
                        <TableCell className="text-right number-mono">
                          {Math.round(r.inputTokens).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right number-mono">
                          {Math.round(r.outputTokens).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </section>

            <section className="grid gap-4 md:grid-cols-3">
              <MetricCard
                icon={<Zap className="size-4" />}
                label="Total input tokens"
                value={Math.round(totalInputTokens).toLocaleString()}
              />
              <MetricCard
                icon={<Coins className="size-4" />}
                label="Total output tokens"
                value={Math.round(totalOutputTokens).toLocaleString()}
              />
              <MetricCard
                highlight
                icon={<Wallet className="size-4" />}
                label="Estimated cost"
                value={`$${totalCost.toFixed(4)}`}
                sub={
                  modelData
                    ? `${numRequests} request(s) · ${modelData.model_name}`
                    : "Select a model"
                }
              />
            </section>
          </>
        ) : (
          <section className="card-elevated p-12 text-center">
            <p className="text-sm text-muted-foreground">
              Select an application above to start estimating.
            </p>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function MetricCard({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`card-elevated p-5 ${
        highlight ? "ring-1 ring-primary/40 bg-primary/5" : ""
      }`}
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <span className={highlight ? "text-primary" : ""}>{icon}</span>
        {label}
      </div>
      <div
        className={`mt-3 text-3xl font-semibold number-mono ${
          highlight ? "text-primary" : ""
        }`}
      >
        {value}
      </div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
