// API client for the Flask backend (app.py).
// Base URL is configured via VITE_API_BASE_URL in .env so it can be changed in one place.

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") || "http://localhost:5000";

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

// Backend returns pricing items with `model` field rather than `model_name`.
type ApiPricing = {
  id: number;
  model: string;
  input_price: number;
  output_price: number;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // ignore non-json
  }
  if (!res.ok || (body && body.success === false)) {
    const msg = (body && body.error) || `Request failed: ${res.status}`;
    throw new Error(msg);
  }
  return body as T;
}

const fromApiPricing = (p: ApiPricing): ModelPricing => ({
  id: p.id,
  model_name: p.model,
  input_price: p.input_price,
  output_price: p.output_price,
});

export async function fetchApplications(): Promise<Application[]> {
  const data = await request<{ success: boolean; applications: Application[] }>("/api/applications");
  return data.applications;
}

export async function createApplication(input: { name: string; description: string }) {
  const data = await request<{ success: boolean; application: Application }>("/api/applications", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.application;
}

export async function deleteApplication(_id: number): Promise<void> {
  // Backend does not expose a delete endpoint for applications.
  throw new Error("Deleting applications is not supported by the backend.");
}

export async function createService(input: {
  app_id: number;
  name: string;
  input_words: number;
  output_words: number;
}) {
  const { app_id, ...payload } = input;
  const data = await request<{ success: boolean; service: Service }>(
    `/api/applications/${app_id}/services`,
    { method: "POST", body: JSON.stringify(payload) },
  );
  return data.service;
}

export async function updateService(
  id: number,
  input: { name: string; input_words: number; output_words: number },
) {
  const data = await request<{ success: boolean; service: Service }>(`/api/services/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return data.service;
}

export async function deleteService(id: number) {
  await request(`/api/services/${id}`, { method: "DELETE" });
}

export async function fetchPricing(): Promise<ModelPricing[]> {
  const data = await request<{ success: boolean; pricing: ApiPricing[] }>("/api/pricing");
  return data.pricing.map(fromApiPricing).sort((a, b) => a.model_name.localeCompare(b.model_name));
}

export async function createPricing(input: {
  model_name: string;
  input_price: number;
  output_price: number;
}) {
  const data = await request<{ success: boolean; model: ApiPricing }>("/api/pricing", {
    method: "POST",
    body: JSON.stringify({
      model: input.model_name,
      input_price: input.input_price,
      output_price: input.output_price,
    }),
  });
  return fromApiPricing(data.model);
}

export async function updatePricing(
  id: number,
  input: { model_name: string; input_price: number; output_price: number },
) {
  const data = await request<{ success: boolean; model: ApiPricing }>(`/api/pricing/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      model: input.model_name,
      input_price: input.input_price,
      output_price: input.output_price,
    }),
  });
  return fromApiPricing(data.model);
}

export async function deletePricing(id: number) {
  await request(`/api/pricing/${id}`, { method: "DELETE" });
}

export const TOKEN_WORD_RATIO = 1.5;
