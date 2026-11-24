-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: writing_characters
-- 12 vowels (beginner) + 35 consonants (25 beginner, 10 intermediate)
-- stroke_data is an empty array placeholder — replace with real SVG path data
-- ─────────────────────────────────────────────────────────────────────────────

insert into public.writing_characters
  (character, type, transliteration, stroke_data, level, order_index)
values
  -- ── Vowels (beginner, 1-12) ───────────────────────────────────────────────
  ('अ', 'vowel', 'a',   '[]', 'beginner', 1),
  ('आ', 'vowel', 'ā',   '[]', 'beginner', 2),
  ('इ', 'vowel', 'i',   '[]', 'beginner', 3),
  ('ई', 'vowel', 'ī',   '[]', 'beginner', 4),
  ('उ', 'vowel', 'u',   '[]', 'beginner', 5),
  ('ऊ', 'vowel', 'ū',   '[]', 'beginner', 6),
  ('ए', 'vowel', 'e',   '[]', 'beginner', 7),
  ('ऐ', 'vowel', 'ai',  '[]', 'beginner', 8),
  ('ओ', 'vowel', 'o',   '[]', 'beginner', 9),
  ('औ', 'vowel', 'au',  '[]', 'beginner', 10),
  ('अं','vowel', 'aṃ',  '[]', 'beginner', 11),
  ('अः','vowel', 'aḥ',  '[]', 'beginner', 12),

  -- ── Consonants — beginner (ka-ña, 13-37) ─────────────────────────────────
  ('क', 'consonant', 'ka',  '[]', 'beginner', 13),
  ('ख', 'consonant', 'kha', '[]', 'beginner', 14),
  ('ग', 'consonant', 'ga',  '[]', 'beginner', 15),
  ('घ', 'consonant', 'gha', '[]', 'beginner', 16),
  ('ङ', 'consonant', 'ṅa',  '[]', 'beginner', 17),
  ('च', 'consonant', 'ca',  '[]', 'beginner', 18),
  ('छ', 'consonant', 'cha', '[]', 'beginner', 19),
  ('ज', 'consonant', 'ja',  '[]', 'beginner', 20),
  ('झ', 'consonant', 'jha', '[]', 'beginner', 21),
  ('ञ', 'consonant', 'ña',  '[]', 'beginner', 22),
  ('ट', 'consonant', 'ṭa',  '[]', 'beginner', 23),
  ('ठ', 'consonant', 'ṭha', '[]', 'beginner', 24),
  ('ड', 'consonant', 'ḍa',  '[]', 'beginner', 25),
  ('ढ', 'consonant', 'ḍha', '[]', 'beginner', 26),
  ('ण', 'consonant', 'ṇa',  '[]', 'beginner', 27),
  ('त', 'consonant', 'ta',  '[]', 'beginner', 28),
  ('थ', 'consonant', 'tha', '[]', 'beginner', 29),
  ('द', 'consonant', 'da',  '[]', 'beginner', 30),
  ('ध', 'consonant', 'dha', '[]', 'beginner', 31),
  ('न', 'consonant', 'na',  '[]', 'beginner', 32),
  ('प', 'consonant', 'pa',  '[]', 'beginner', 33),
  ('फ', 'consonant', 'pha', '[]', 'beginner', 34),
  ('ब', 'consonant', 'ba',  '[]', 'beginner', 35),
  ('भ', 'consonant', 'bha', '[]', 'beginner', 36),
  ('म', 'consonant', 'ma',  '[]', 'beginner', 37),

  -- ── Consonants — intermediate (ya-ha + ḷa, 38-47) ────────────────────────
  ('य', 'consonant', 'ya',  '[]', 'intermediate', 38),
  ('र', 'consonant', 'ra',  '[]', 'intermediate', 39),
  ('ल', 'consonant', 'la',  '[]', 'intermediate', 40),
  ('व', 'consonant', 'va',  '[]', 'intermediate', 41),
  ('श', 'consonant', 'śa',  '[]', 'intermediate', 42),
  ('ष', 'consonant', 'ṣa',  '[]', 'intermediate', 43),
  ('स', 'consonant', 'sa',  '[]', 'intermediate', 44),
  ('ह', 'consonant', 'ha',  '[]', 'intermediate', 45),
  ('ळ', 'consonant', 'ḷa',  '[]', 'intermediate', 46),
  ('क्ष','conjunct', 'kṣa', '[]', 'intermediate', 47);
