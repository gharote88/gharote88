-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: lessons (30 lessons)
-- ─────────────────────────────────────────────────────────────────────────────

insert into public.lessons (id, title, title_marathi, level, topic, order_index, estimated_minutes, xp_reward)
values
  -- Beginner
  ('00000001-0000-0000-0000-000000000001', 'Greetings and Introductions',    'नमस्कार आणि परिचय',          'beginner',     'greetings',      1,  15, 50),
  ('00000001-0000-0000-0000-000000000002', 'Numbers and Counting',           'संख्या आणि मोजणी',           'beginner',     'numbers',        2,  18, 55),
  ('00000001-0000-0000-0000-000000000003', 'Family Members',                 'कुटुंब सदस्य',               'beginner',     'family',         3,  20, 60),
  ('00000001-0000-0000-0000-000000000004', 'Colors and Descriptions',        'रंग आणि वर्णन',              'beginner',     'colors',         4,  16, 50),
  ('00000001-0000-0000-0000-000000000005', 'Days and Time',                  'दिवस आणि वेळ',               'beginner',     'time',           5,  18, 55),
  ('00000001-0000-0000-0000-000000000006', 'Food and Drinks',                'अन्न आणि पेय',               'beginner',     'food',           6,  20, 60),
  ('00000001-0000-0000-0000-000000000007', 'Basic Questions',                'मूलभूत प्रश्न',              'beginner',     'questions',      7,  16, 50),
  ('00000001-0000-0000-0000-000000000008', 'Common Verbs',                   'सामान्य क्रियापदे',          'beginner',     'verbs',          8,  18, 55),
  ('00000001-0000-0000-0000-000000000009', 'At Home',                        'घरात',                       'beginner',     'home',           9,  20, 60),
  ('00000001-0000-0000-0000-000000000010', 'Weather and Seasons',            'हवामान आणि हंगाम',           'beginner',     'weather',        10, 16, 50),
  -- Intermediate
  ('00000001-0000-0000-0000-000000000011', 'Shopping and Markets',           'खरेदी आणि बाजार',            'intermediate', 'shopping',       11, 22, 70),
  ('00000001-0000-0000-0000-000000000012', 'Transportation and Travel',      'वाहतूक आणि प्रवास',          'intermediate', 'transportation', 12, 20, 65),
  ('00000001-0000-0000-0000-000000000013', 'School and Education',           'शाळा आणि शिक्षण',            'intermediate', 'education',      13, 22, 70),
  ('00000001-0000-0000-0000-000000000014', 'Health and Body',                'आरोग्य आणि शरीर',            'intermediate', 'health',         14, 20, 65),
  ('00000001-0000-0000-0000-000000000015', 'Emotions and Feelings',          'भावना आणि अनुभव',            'intermediate', 'emotions',       15, 18, 60),
  ('00000001-0000-0000-0000-000000000016', 'Hobbies and Interests',          'छंद आणि आवड',                'intermediate', 'hobbies',        16, 20, 65),
  ('00000001-0000-0000-0000-000000000017', 'Work and Profession',            'काम आणि व्यवसाय',            'intermediate', 'work',           17, 22, 70),
  ('00000001-0000-0000-0000-000000000018', 'Festivals and Celebrations',     'सण आणि सोहळे',               'intermediate', 'festivals',      18, 24, 75),
  ('00000001-0000-0000-0000-000000000019', 'Marathi Literature',             'मराठी साहित्य',              'intermediate', 'literature',     19, 22, 70),
  ('00000001-0000-0000-0000-000000000020', 'Geography of Maharashtra',       'महाराष्ट्राचा भूगोल',        'intermediate', 'geography',      20, 20, 65),
  -- Advanced
  ('00000001-0000-0000-0000-000000000021', 'Advanced Conversations',         'प्रगत संभाषण',               'advanced',     'conversation',   21, 25, 80),
  ('00000001-0000-0000-0000-000000000022', 'Business Marathi',               'व्यवसायिक मराठी',            'advanced',     'business',       22, 24, 75),
  ('00000001-0000-0000-0000-000000000023', 'Marathi Poetry',                 'मराठी कविता',                'advanced',     'poetry',         23, 26, 85),
  ('00000001-0000-0000-0000-000000000024', 'Marathi Cinema and Arts',        'मराठी सिनेमा आणि कला',       'advanced',     'arts',           24, 24, 75),
  ('00000001-0000-0000-0000-000000000025', 'Marathi History',                'मराठी इतिहास',               'advanced',     'history',        25, 26, 85),
  ('00000001-0000-0000-0000-000000000026', 'Marathi Cuisine',                'मराठी अन्न',                 'advanced',     'cuisine',        26, 24, 75),
  ('00000001-0000-0000-0000-000000000027', 'Marathi Folklore',               'मराठी लोककथा',               'advanced',     'folklore',       27, 26, 85),
  ('00000001-0000-0000-0000-000000000028', 'Marathi Philosophy',             'मराठी तत्त्वज्ञान',          'advanced',     'philosophy',     28, 28, 90),
  ('00000001-0000-0000-0000-000000000029', 'Marathi Science and Technology', 'मराठी विज्ञान आणि तंत्रज्ञान','advanced',    'science',        29, 26, 85),
  ('00000001-0000-0000-0000-000000000030', 'Marathi Mastery',                'मराठी प्रवीणता',             'advanced',     'mastery',        30, 30, 100)
on conflict (id) do nothing;
