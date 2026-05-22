-- Run this in the Supabase SQL editor for the project database.
-- Adds the actors column used by profile-service for favorite actors.

alter table public.profile
  add column if not exists actors text[] not null default '{}';
