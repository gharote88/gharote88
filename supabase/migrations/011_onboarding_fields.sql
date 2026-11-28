-- Migration 011: Add onboarding fields to users table
alter table public.users
  add column if not exists onboarding_complete boolean not null default false,
  add column if not exists gender text,
  add column if not exists native_language text,
  add column if not exists motivation text,
  add column if not exists avatar_emoji text;
