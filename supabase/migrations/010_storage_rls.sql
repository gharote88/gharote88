-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 010: Storage Bucket RLS Policies
--
-- Buckets (create manually in Supabase Dashboard → Storage):
--   - avatars      (public)  — user profile pictures
--   - audio        (public)  — pronunciation audio files
--   - certificates (private) — user journey certificates
--
-- Storage path convention:
--   avatars/      → {user_id}/avatar.{ext}
--   audio/        → public files, authenticated upload
--   certificates/ → {user_id}/{certificate_id}.pdf
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── AVATARS ─────────────────────────────────────────────────────────────────

-- Anyone can view avatars (public bucket)
create policy "avatars public select"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Authenticated user can upload to their own folder
create policy "avatars owner insert"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Owner can update/replace their avatar
create policy "avatars owner update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Owner can delete their avatar
create policy "avatars owner delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ─── AUDIO ───────────────────────────────────────────────────────────────────

-- Anyone can read audio files (public bucket)
create policy "audio public select"
  on storage.objects for select
  using (bucket_id = 'audio');

-- Only authenticated users can upload audio (server uses service role for seeding)
create policy "audio authenticated insert"
  on storage.objects for insert
  with check (
    bucket_id = 'audio'
    and auth.role() = 'authenticated'
  );

-- No client-side update/delete; managed via service role only
create policy "audio no client update"
  on storage.objects for update
  using (false)
  with check (bucket_id = 'audio');

create policy "audio no client delete"
  on storage.objects for delete
  using (bucket_id = 'audio' and false);

-- ─── CERTIFICATES ────────────────────────────────────────────────────────────

-- Only the owner can read their own certificates (private bucket)
create policy "certificates owner select"
  on storage.objects for select
  using (
    bucket_id = 'certificates'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Server (service role) generates and uploads certificates; block client insert
create policy "certificates no client insert"
  on storage.objects for insert
  with check (bucket_id = 'certificates' and false);

-- No client-side update/delete
create policy "certificates no client update"
  on storage.objects for update
  using (false)
  with check (bucket_id = 'certificates');

create policy "certificates no client delete"
  on storage.objects for delete
  using (bucket_id = 'certificates' and false);
