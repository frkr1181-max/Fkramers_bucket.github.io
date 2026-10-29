INSERT INTO public.destinations (slug, name, iso_alpha2, region, research_owner, active) VALUES ('brazil', 'Brazil', 'BR', 'South America', 'Divya', true), ('cabo-verde', 'Cabo Verde', 'CV', 'Africa', 'Divya', true), ('canada', 'Canada', 'CA', 'North America', 'Divya', true), ('colombia', 'Colombia', 'CO', 'South America', 'Divya', true), ('croatia', 'Croatia', 'HR', 'Europe', 'Divya', true), ('czechia', 'Czechia', 'CZ', 'Europe', 'Divya', true), ('spain', 'Spain', 'ES', 'Europe', 'Frankie', true), ('sweden', 'Sweden', 'SE', 'Europe', 'Frankie', true), ('switzerland', 'Switzerland', 'CH', 'Europe', 'Frankie', true), ('turkiye', 'Türkiye', 'TR', 'Europe', 'Frankie', true), ('uruguay', 'Uruguay', 'UY', 'South America', 'Frankie', true), ('uzbekistan', 'Uzbekistan', 'UZ', 'Asia', 'Frankie', true) ON CONFLICT (slug) DO NOTHING;
-- Add only the 12 pilot destinations missing from the current roster, while preserving any row already present.
GRANT SELECT ON TABLE public.destinations TO anon;
-- Allow anonymous app clients to read destination records, with row access still limited by RLS.
GRANT SELECT ON TABLE public.travel_facts TO anon;
-- Allow anonymous app clients to read travel facts, with row access still limited by RLS.
CREATE POLICY public_read_active_destinations ON public.destinations FOR SELECT TO anon USING (active IS TRUE);
-- Expose only destinations marked active through the public Data API.
CREATE POLICY public_read_published_travel_facts ON public.travel_facts FOR SELECT TO anon USING (published IS TRUE);
-- Expose only facts the team has explicitly published through the public Data API.
