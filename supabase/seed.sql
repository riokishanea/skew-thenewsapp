-- Skew source configuration seed (AGENTS.md sections 8 and 11).
-- Active homepage entry pages only. Safe to run repeatedly in Supabase SQL Editor.

insert into public.sources (name, listing_url, is_active)
values
  ('Reuters', 'https://www.reuters.com/', true),
  ('NPR', 'https://www.npr.org/', true),
  ('Fox News', 'https://www.foxnews.com/', true),
  ('BBC', 'https://www.bbc.com/news', true),
  ('The Guardian', 'https://www.theguardian.com/us', true)
on conflict (listing_url) do nothing;
