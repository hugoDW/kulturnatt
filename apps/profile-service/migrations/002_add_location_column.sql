-- Run this in the Supabase SQL editor for the project database.
-- Adds the location column used by profile-service for the user's city/area.

alter table public.profile
  add column if not exists location text not null default '';
