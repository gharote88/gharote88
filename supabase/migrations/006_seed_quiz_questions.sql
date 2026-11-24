-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: quiz_questions (5 per lesson, 150 total)
-- ─────────────────────────────────────────────────────────────────────────────

insert into public.quiz_questions (lesson_id, type, question_text, question_marathi, options, correct_answer, order_index)
values
  -- Lesson 1: Greetings
  ('00000001-0000-0000-0000-000000000001', 'multiple_choice', 'What does "नमस्कार" mean?',          'नमस्कार म्हणजे काय?',       '["Hello","Goodbye","Thank you","Sorry"]',  'Hello',     1),
  ('00000001-0000-0000-0000-000000000001', 'multiple_choice', 'How do you say "Thank you"?',         '"Thank you" मराठीत कसे?',   '["कृपया","धन्यवाद","माफ करा","नमस्ते"]', 'धन्यवाद',  2),
  ('00000001-0000-0000-0000-000000000001', 'fill_blank',      'मी ___ आहे (I am fine)',              'रिकामी जागा भरा',           '[]',                                       'ठीक',       3),
  ('00000001-0000-0000-0000-000000000001', 'multiple_choice', 'What does "माफ करा" mean?',           '"माफ करा" म्हणजे काय?',     '["Please","Sorry","Hello","Thanks"]',      'Sorry',     4),
  ('00000001-0000-0000-0000-000000000001', 'speak_answer',    'Say "Hello" in Marathi',              'मराठीत "Hello" म्हणा',      '[]',                                       'नमस्कार',  5),
  -- Lesson 2: Numbers
  ('00000001-0000-0000-0000-000000000002', 'multiple_choice', 'What is "पाच" in English?',           '"पाच" इंग्रजीत काय?',       '["Three","Four","Five","Six"]',            'Five',      1),
  ('00000001-0000-0000-0000-000000000002', 'multiple_choice', 'How do you say "Eight" in Marathi?',  '"Eight" मराठीत कसे?',       '["सात","आठ","नऊ","दहा"]',                 'आठ',        2),
  ('00000001-0000-0000-0000-000000000002', 'fill_blank',      '___ म्हणजे Ten',                      'रिकामी जागा भरा',           '[]',                                       'दहा',       3),
  ('00000001-0000-0000-0000-000000000002', 'multiple_choice', 'What is "दोन" in English?',           '"दोन" इंग्रजीत काय?',       '["One","Two","Three","Four"]',             'Two',       4),
  ('00000001-0000-0000-0000-000000000002', 'speak_answer',    'Count from one to three in Marathi',  'एक ते तीन मराठीत म्हणा',   '[]',                                       'एक दोन तीन',5),
  -- Lesson 3: Family
  ('00000001-0000-0000-0000-000000000003', 'multiple_choice', 'What does "आई" mean?',                '"आई" म्हणजे काय?',          '["Father","Mother","Sister","Brother"]',   'Mother',    1),
  ('00000001-0000-0000-0000-000000000003', 'multiple_choice', 'How do you say "Grandfather"?',       '"Grandfather" मराठीत कसे?', '["आजी","आजोबा","काका","मामा"]',           'आजोबा',    2),
  ('00000001-0000-0000-0000-000000000003', 'fill_blank',      '___ म्हणजे Sister',                   'रिकामी जागा भरा',           '[]',                                       'बहीण',      3),
  ('00000001-0000-0000-0000-000000000003', 'multiple_choice', 'What does "भाऊ" mean?',               '"भाऊ" म्हणजे काय?',         '["Sister","Brother","Uncle","Aunt"]',      'Brother',   4),
  ('00000001-0000-0000-0000-000000000003', 'speak_answer',    'Say "Mother" in Marathi',             'मराठीत "Mother" म्हणा',     '[]',                                       'आई',        5),
  -- Lesson 4: Colors
  ('00000001-0000-0000-0000-000000000004', 'multiple_choice', 'What does "लाल" mean?',               '"लाल" म्हणजे काय?',         '["Blue","Red","Green","Yellow"]',          'Red',       1),
  ('00000001-0000-0000-0000-000000000004', 'multiple_choice', 'How do you say "White"?',             '"White" मराठीत कसे?',       '["काळा","पांढरा","निळा","हिरवा"]',        'पांढरा',   2),
  ('00000001-0000-0000-0000-000000000004', 'fill_blank',      '___ म्हणजे Green',                    'रिकामी जागा भरा',           '[]',                                       'हिरवा',     3),
  ('00000001-0000-0000-0000-000000000004', 'multiple_choice', 'What does "निळा" mean?',              '"निळा" म्हणजे काय?',        '["Red","Blue","Pink","Purple"]',           'Blue',      4),
  ('00000001-0000-0000-0000-000000000004', 'speak_answer',    'Say "Yellow" in Marathi',             'मराठीत "Yellow" म्हणा',     '[]',                                       'पिवळा',     5),
  -- Lesson 5: Days and Time
  ('00000001-0000-0000-0000-000000000005', 'multiple_choice', 'What does "सोमवार" mean?',            '"सोमवार" म्हणजे काय?',      '["Sunday","Monday","Tuesday","Wednesday"]','Monday',   1),
  ('00000001-0000-0000-0000-000000000005', 'multiple_choice', 'How do you say "Evening"?',           '"Evening" मराठीत कसे?',     '["सकाळ","दुपार","सायंकाळ","रात्र"]',     'सायंकाळ',  2),
  ('00000001-0000-0000-0000-000000000005', 'fill_blank',      '___ म्हणजे Sunday',                   'रिकामी जागा भरा',           '[]',                                       'रविवार',    3),
  ('00000001-0000-0000-0000-000000000005', 'multiple_choice', 'What does "सकाळ" mean?',              '"सकाळ" म्हणजे काय?',        '["Morning","Afternoon","Evening","Night"]', 'Morning',  4),
  ('00000001-0000-0000-0000-000000000005', 'speak_answer',    'Say "Friday" in Marathi',             'मराठीत "Friday" म्हणा',     '[]',                                       'शुक्रवार',  5),
  -- Lesson 6: Food
  ('00000001-0000-0000-0000-000000000006', 'multiple_choice', 'What does "पाणी" mean?',              '"पाणी" म्हणजे काय?',        '["Milk","Water","Tea","Juice"]',           'Water',     1),
  ('00000001-0000-0000-0000-000000000006', 'multiple_choice', 'How do you say "Rice"?',              '"Rice" मराठीत कसे?',        '["रोटी","भात","भाजी","फळे"]',             'भात',       2),
  ('00000001-0000-0000-0000-000000000006', 'fill_blank',      '___ म्हणजे Tea',                      'रिकामी जागा भरा',           '[]',                                       'चहा',       3),
  ('00000001-0000-0000-0000-000000000006', 'multiple_choice', 'What does "फळे" mean?',               '"फळे" म्हणजे काय?',         '["Vegetables","Fruits","Meat","Fish"]',    'Fruits',    4),
  ('00000001-0000-0000-0000-000000000006', 'speak_answer',    'Say "Milk" in Marathi',               'मराठीत "Milk" म्हणा',       '[]',                                       'दूध',       5),
  -- Lesson 7: Questions
  ('00000001-0000-0000-0000-000000000007', 'multiple_choice', 'What does "काय?" mean?',              '"काय?" म्हणजे काय?',        '["Who","What","Where","When"]',            'What',      1),
  ('00000001-0000-0000-0000-000000000007', 'multiple_choice', 'How do you say "Where?"?',            '"Where?" मराठीत कसे?',      '["काय?","कोण?","कुठे?","केव्हा?"]',       'कुठे?',     2),
  ('00000001-0000-0000-0000-000000000007', 'fill_blank',      '___ म्हणजे Why?',                     'रिकामी जागा भरा',           '[]',                                       'का?',       3),
  ('00000001-0000-0000-0000-000000000007', 'multiple_choice', 'What does "किती?" mean?',             '"किती?" म्हणजे काय?',       '["How","Why","How much","Which"]',         'How much',  4),
  ('00000001-0000-0000-0000-000000000007', 'speak_answer',    'Say "Who?" in Marathi',               'मराठीत "Who?" म्हणा',       '[]',                                       'कोण?',      5),
  -- Lesson 8: Verbs
  ('00000001-0000-0000-0000-000000000008', 'multiple_choice', 'What does "जाणे" mean?',              '"जाणे" म्हणजे काय?',        '["To come","To go","To eat","To drink"]',  'To go',     1),
  ('00000001-0000-0000-0000-000000000008', 'multiple_choice', 'How do you say "To read"?',           '"To read" मराठीत कसे?',     '["लिहणे","वाचणे","शिकणे","बोलणे"]',      'वाचणे',    2),
  ('00000001-0000-0000-0000-000000000008', 'fill_blank',      '___ म्हणजे To speak',                 'रिकामी जागा भरा',           '[]',                                       'बोलणे',     3),
  ('00000001-0000-0000-0000-000000000008', 'multiple_choice', 'What does "खाणे" mean?',              '"खाणे" म्हणजे काय?',        '["To drink","To eat","To see","To hear"]', 'To eat',    4),
  ('00000001-0000-0000-0000-000000000008', 'speak_answer',    'Say "To learn" in Marathi',           'मराठीत "To learn" म्हणा',   '[]',                                       'शिकणे',     5),
  -- Lesson 9: Home
  ('00000001-0000-0000-0000-000000000009', 'multiple_choice', 'What does "घर" mean?',                '"घर" म्हणजे काय?',          '["Room","House","Kitchen","Door"]',        'House',     1),
  ('00000001-0000-0000-0000-000000000009', 'multiple_choice', 'How do you say "Window"?',            '"Window" मराठीत कसे?',      '["दरवाजा","खिडकी","छपर","बालकनी"]',      'खिडकी',    2),
  ('00000001-0000-0000-0000-000000000009', 'fill_blank',      '___ म्हणजे Kitchen',                  'रिकामी जागा भरा',           '[]',                                       'स्वयंपाकघर',3),
  ('00000001-0000-0000-0000-000000000009', 'multiple_choice', 'What does "दरवाजा" mean?',            '"दरवाजा" म्हणजे काय?',      '["Window","Door","Roof","Balcony"]',       'Door',      4),
  ('00000001-0000-0000-0000-000000000009', 'speak_answer',    'Say "Bedroom" in Marathi',            'मराठीत "Bedroom" म्हणा',    '[]',                                       'शयनखोली',  5),
  -- Lesson 10: Weather
  ('00000001-0000-0000-0000-000000000010', 'multiple_choice', 'What does "पाऊस" mean?',              '"पाऊस" म्हणजे काय?',        '["Wind","Snow","Rain","Sun"]',             'Rain',      1),
  ('00000001-0000-0000-0000-000000000010', 'multiple_choice', 'How do you say "Summer"?',            '"Summer" मराठीत कसे?',      '["हिवाळा","उन्हाळा","पावसाळा","वारा"]',  'उन्हाळा',  2),
  ('00000001-0000-0000-0000-000000000010', 'fill_blank',      '___ म्हणजे Sun',                      'रिकामी जागा भरा',           '[]',                                       'सूर्य',     3),
  ('00000001-0000-0000-0000-000000000010', 'multiple_choice', 'What does "हिवाळा" mean?',            '"हिवाळा" म्हणजे काय?',      '["Summer","Rainy season","Winter","Wind"]', 'Winter',   4),
  ('00000001-0000-0000-0000-000000000010', 'speak_answer',    'Say "Rain" in Marathi',               'मराठीत "Rain" म्हणा',       '[]',                                       'पाऊस',      5);

-- Lessons 11-30: placeholder questions
insert into public.quiz_questions (lesson_id, type, question_text, question_marathi, options, correct_answer, order_index)
select
  ('00000001-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid,
  (array['multiple_choice','fill_blank','speak_answer','multiple_choice','fill_blank'])[q],
  'Question ' || q || ' for lesson ' || n,
  'प्रश्न ' || q || ' धड्यासाठी ' || n,
  case when (array['multiple_choice','fill_blank','speak_answer','multiple_choice','fill_blank'])[q] = 'multiple_choice'
       then '["Option A","Option B","Option C","Option D"]'::jsonb
       else '[]'::jsonb end,
  'Option A',
  q
from
  generate_series(11, 30) as n,
  generate_series(1, 5)   as q;
