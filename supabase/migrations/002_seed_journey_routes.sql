-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: journey_routes
-- ─────────────────────────────────────────────────────────────────────────────

insert into public.journey_routes
  (id, start_city, start_city_marathi, target_city, description, distance_km, total_xp_required, checkpoints)
values
  (
    'a1b2c3d4-0001-0000-0000-000000000001',
    'Mumbai', 'मुंबई', 'Pune',
    'From the city of dreams to the cultural capital',
    150, 5000,
    '[
      {"id":"mumbai",    "name":"Mumbai",    "marathiName":"मुंबई",    "position":{"x":50, "y":450}, "requiredXp":0,    "unlocks":["lesson_1","lesson_2"],  "triviaId":"fact_mumbai"},
      {"id":"lonavala",  "name":"Lonavala",  "marathiName":"लोणावळा", "position":{"x":150,"y":350}, "requiredXp":1000, "unlocks":["lesson_3","lesson_4"],  "triviaId":"fact_lonavala"},
      {"id":"khandala",  "name":"Khandala",  "marathiName":"खंडाळा",  "position":{"x":200,"y":300}, "requiredXp":2000, "unlocks":["lesson_5","lesson_6"],  "triviaId":"fact_khandala"},
      {"id":"talegaon",  "name":"Talegaon",  "marathiName":"तळेगाव",  "position":{"x":260,"y":260}, "requiredXp":3500, "unlocks":["lesson_7","lesson_8"],  "triviaId":"fact_talegaon"},
      {"id":"pune",      "name":"Pune",      "marathiName":"पुणे",     "position":{"x":320,"y":220}, "requiredXp":5000, "unlocks":["lesson_9","lesson_10"], "triviaId":"fact_pune"}
    ]'::jsonb
  ),
  (
    'a1b2c3d4-0002-0000-0000-000000000002',
    'Nagpur', 'नागपूर', 'Pune',
    'From the orange city to the cultural capital',
    700, 5000,
    '[
      {"id":"nagpur",    "name":"Nagpur",    "marathiName":"नागपूर",   "position":{"x":600,"y":200}, "requiredXp":0,    "unlocks":["lesson_1","lesson_2"],  "triviaId":"fact_nagpur"},
      {"id":"wardha",    "name":"Wardha",    "marathiName":"वर्धा",    "position":{"x":520,"y":230}, "requiredXp":1000, "unlocks":["lesson_3","lesson_4"],  "triviaId":"fact_wardha"},
      {"id":"amravati",  "name":"Amravati",  "marathiName":"अमरावती", "position":{"x":440,"y":260}, "requiredXp":2000, "unlocks":["lesson_5","lesson_6"],  "triviaId":"fact_amravati"},
      {"id":"aurangabad","name":"Aurangabad","marathiName":"औरंगाबाद","position":{"x":360,"y":290}, "requiredXp":3500, "unlocks":["lesson_7","lesson_8"],  "triviaId":"fact_aurangabad"},
      {"id":"pune",      "name":"Pune",      "marathiName":"पुणे",     "position":{"x":320,"y":220}, "requiredXp":5000, "unlocks":["lesson_9","lesson_10"], "triviaId":"fact_pune"}
    ]'::jsonb
  ),
  (
    'a1b2c3d4-0003-0000-0000-000000000003',
    'Aurangabad', 'औरंगाबाद', 'Pune',
    'From the city of gates to the cultural capital',
    235, 5000,
    '[
      {"id":"aurangabad", "name":"Aurangabad","marathiName":"औरंगाबाद","position":{"x":360,"y":290}, "requiredXp":0,    "unlocks":["lesson_1","lesson_2"],  "triviaId":"fact_aurangabad"},
      {"id":"ahmednagar", "name":"Ahmednagar","marathiName":"अहमदनगर", "position":{"x":340,"y":270}, "requiredXp":1000, "unlocks":["lesson_3","lesson_4"],  "triviaId":"fact_ahmednagar"},
      {"id":"shirdi",     "name":"Shirdi",    "marathiName":"शिर्डी",   "position":{"x":330,"y":255}, "requiredXp":2500, "unlocks":["lesson_5","lesson_6"],  "triviaId":"fact_shirdi"},
      {"id":"pune",       "name":"Pune",      "marathiName":"पुणे",     "position":{"x":320,"y":220}, "requiredXp":5000, "unlocks":["lesson_7","lesson_8"],  "triviaId":"fact_pune"}
    ]'::jsonb
  ),
  (
    'a1b2c3d4-0004-0000-0000-000000000004',
    'Nashik', 'नाशिक', 'Pune',
    'From the wine capital to the cultural capital',
    210, 5000,
    '[
      {"id":"nashik",   "name":"Nashik",   "marathiName":"नाशिक",   "position":{"x":200,"y":180}, "requiredXp":0,    "unlocks":["lesson_1","lesson_2"],  "triviaId":"fact_nashik"},
      {"id":"igatpuri", "name":"Igatpuri", "marathiName":"इगतपुरी", "position":{"x":220,"y":210}, "requiredXp":1000, "unlocks":["lesson_3","lesson_4"],  "triviaId":"fact_igatpuri"},
      {"id":"ghoti",    "name":"Ghoti",    "marathiName":"घोटी",    "position":{"x":240,"y":230}, "requiredXp":2500, "unlocks":["lesson_5","lesson_6"],  "triviaId":"fact_ghoti"},
      {"id":"pune",     "name":"Pune",     "marathiName":"पुणे",     "position":{"x":320,"y":220}, "requiredXp":5000, "unlocks":["lesson_7","lesson_8"],  "triviaId":"fact_pune"}
    ]'::jsonb
  ),
  (
    'a1b2c3d4-0005-0000-0000-000000000005',
    'Kolhapur', 'कोल्हापूर', 'Pune',
    'From the city of Mahalakshmi to the cultural capital',
    230, 5000,
    '[
      {"id":"kolhapur", "name":"Kolhapur", "marathiName":"कोल्हापूर","position":{"x":200,"y":500}, "requiredXp":0,    "unlocks":["lesson_1","lesson_2"],  "triviaId":"fact_kolhapur"},
      {"id":"satara",   "name":"Satara",   "marathiName":"सातारा",   "position":{"x":240,"y":420}, "requiredXp":1000, "unlocks":["lesson_3","lesson_4"],  "triviaId":"fact_satara"},
      {"id":"wai",      "name":"Wai",      "marathiName":"वाई",      "position":{"x":270,"y":360}, "requiredXp":2000, "unlocks":["lesson_5","lesson_6"],  "triviaId":"fact_wai"},
      {"id":"khandala", "name":"Khandala", "marathiName":"खंडाळा",  "position":{"x":290,"y":300}, "requiredXp":3500, "unlocks":["lesson_7","lesson_8"],  "triviaId":"fact_khandala"},
      {"id":"pune",     "name":"Pune",     "marathiName":"पुणे",     "position":{"x":320,"y":220}, "requiredXp":5000, "unlocks":["lesson_9","lesson_10"], "triviaId":"fact_pune"}
    ]'::jsonb
  )
on conflict (id) do nothing;
