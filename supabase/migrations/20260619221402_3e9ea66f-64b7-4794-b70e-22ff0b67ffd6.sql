
CREATE TABLE public.applications (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.applications_id_seq TO anon, authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read applications" ON public.applications FOR SELECT USING (true);
CREATE POLICY "public write applications" ON public.applications FOR INSERT WITH CHECK (true);
CREATE POLICY "public update applications" ON public.applications FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete applications" ON public.applications FOR DELETE USING (true);

CREATE TABLE public.services (
  id BIGSERIAL PRIMARY KEY,
  app_id BIGINT NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  input_words INTEGER NOT NULL,
  output_words INTEGER NOT NULL,
  ratio DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.services_id_seq TO anon, authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read services" ON public.services FOR SELECT USING (true);
CREATE POLICY "public write services" ON public.services FOR INSERT WITH CHECK (true);
CREATE POLICY "public update services" ON public.services FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete services" ON public.services FOR DELETE USING (true);

CREATE TABLE public.model_pricing (
  id BIGSERIAL PRIMARY KEY,
  model_name TEXT NOT NULL UNIQUE,
  input_price DOUBLE PRECISION NOT NULL,
  output_price DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.model_pricing TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.model_pricing_id_seq TO anon, authenticated;
GRANT ALL ON public.model_pricing TO service_role;
ALTER TABLE public.model_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read pricing" ON public.model_pricing FOR SELECT USING (true);
CREATE POLICY "public write pricing" ON public.model_pricing FOR INSERT WITH CHECK (true);
CREATE POLICY "public update pricing" ON public.model_pricing FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "public delete pricing" ON public.model_pricing FOR DELETE USING (true);

-- Seed a few common models
INSERT INTO public.model_pricing (model_name, input_price, output_price) VALUES
  ('gpt-5-mini', 0.00000025, 0.000002),
  ('gpt-5', 0.0000025, 0.00001),
  ('gemini-2.5-flash', 0.0000003, 0.0000025),
  ('gemini-2.5-pro', 0.00000125, 0.00001)
ON CONFLICT (model_name) DO NOTHING;
