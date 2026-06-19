import { supabase } from "@/integrations/supabase/client";

export type Service = {
  id: number;
  app_id: number;
  name: string;
  input_words: number;
  output_words: number;
  ratio: number;
};

export type Application = {
  id: number;
  name: string;
  description: string | null;
  services: Service[];
};

export type ModelPricing = {
  id: number;
  model_name: string;
  input_price: number;
  output_price: number;
};

export async function fetchApplications(): Promise<Application[]> {
  const { data: apps, error } = await supabase
    .from("applications" as never)
    .select("id, name, description")
    .order("id", { ascending: true });
  if (error) throw error;
  const { data: svcs, error: e2 } = await supabase
    .from("services" as never)
    .select("id, app_id, name, input_words, output_words, ratio")
    .order("id", { ascending: true });
  if (e2) throw e2;
  const byApp: Record<number, Service[]> = {};
  (svcs as unknown as Service[]).forEach((s) => {
    (byApp[s.app_id] ||= []).push(s);
  });
  return (apps as unknown as { id: number; name: string; description: string | null }[]).map(
    (a) => ({ ...a, services: byApp[a.id] ?? [] }),
  );
}

export async function createApplication(input: { name: string; description: string }) {
  const { data, error } = await supabase
    .from("applications" as never)
    .insert({ name: input.name, description: input.description })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteApplication(id: number) {
  const { error } = await supabase.from("applications" as never).delete().eq("id", id);
  if (error) throw error;
}

export async function createService(input: {
  app_id: number;
  name: string;
  input_words: number;
  output_words: number;
}) {
  const ratio = input.input_words > 0 ? input.output_words / input.input_words : 0;
  const { data, error } = await supabase
    .from("services" as never)
    .insert({ ...input, ratio })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateService(
  id: number,
  input: { name: string; input_words: number; output_words: number },
) {
  const ratio = input.input_words > 0 ? input.output_words / input.input_words : 0;
  const { data, error } = await supabase
    .from("services" as never)
    .update({ ...input, ratio })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteService(id: number) {
  const { error } = await supabase.from("services" as never).delete().eq("id", id);
  if (error) throw error;
}

export async function fetchPricing(): Promise<ModelPricing[]> {
  const { data, error } = await supabase
    .from("model_pricing" as never)
    .select("id, model_name, input_price, output_price")
    .order("model_name", { ascending: true });
  if (error) throw error;
  return data as unknown as ModelPricing[];
}

export async function createPricing(input: {
  model_name: string;
  input_price: number;
  output_price: number;
}) {
  const { data, error } = await supabase
    .from("model_pricing" as never)
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePricing(
  id: number,
  input: { model_name: string; input_price: number; output_price: number },
) {
  const { data, error } = await supabase
    .from("model_pricing" as never)
    .update(input)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePricing(id: number) {
  const { error } = await supabase.from("model_pricing" as never).delete().eq("id", id);
  if (error) throw error;
}

export const TOKEN_WORD_RATIO = 1.5;
