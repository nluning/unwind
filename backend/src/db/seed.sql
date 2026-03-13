-- Categories
INSERT INTO categories (name) VALUES ('Head'), ('Hands'), ('Heart')
ON CONFLICT (name) DO NOTHING;

-- Base activities (user_id = NULL means shared with everyone)

INSERT INTO activities (title, description, suggested_duration, min_stress_level, max_stress_level, source) VALUES
-- Head
('Listen to a podcast episode', 'Pick something light — comedy, storytelling, or a topic you enjoy. Don''t pick anything work-related.', 20, 1, 4, 'base'),
('Do a crossword or word puzzle', 'A small puzzle that occupies your brain just enough.', 15, 1, 3, 'base'),
('Read a chapter of a book', 'Fiction works best for switching off. Keep it to one chapter.', 25, 1, 3, 'base'),
('Watch a short documentary', 'Something you''re curious about but that has nothing to do with work.', 30, 1, 4, 'base'),
('Write down three things that went well today', 'Not a gratitude journal — just a quick brain dump of what didn''t suck.', 5, 2, 5, 'base'),
('Organize one small digital space', 'Clean up one folder, one browser tab group, or one playlist. Just one.', 15, 1, 3, 'base'),
('Learn five words in a new language', 'Use an app or a list. Five words, that''s it.', 10, 1, 3, 'base'),
('Play a simple strategy game', 'Something turn-based or low-pressure. Chess puzzle, Sudoku, a calm city builder.', 20, 1, 3, 'base'),
-- Hands
('Go for a walk around the block', 'No destination, no podcast. Just walking and looking around.', 15, 1, 5, 'base'),
('Stretch for ten minutes', 'Focus on shoulders, neck, and back. Slow and deliberate.', 10, 2, 5, 'base'),
('Doodle or sketch something', 'No goal, no skill required. Scribble shapes, draw your coffee cup, whatever.', 15, 1, 4, 'base'),
('Tidy one surface in your home', 'One desk, one counter, one shelf. That''s the whole task.', 10, 1, 4, 'base'),
('Cook or prepare a simple snack', 'Something hands-on: cut fruit, make toast with toppings, brew tea properly.', 15, 1, 4, 'base'),
('Water your plants', 'If you have them. Check the soil, water what needs it, remove dead leaves.', 10, 1, 5, 'base'),
('Do a short bodyweight workout', 'Ten minutes of squats, push-ups, and planks. Nothing fancy.', 10, 1, 4, 'base'),
('Dance to three songs', 'Close the door if you want. Move however feels good.', 10, 1, 5, 'base'),
('Take a shower or bath', 'Make it intentional — not just getting clean, but resetting.', 15, 2, 5, 'base'),
-- Heart
('Text someone you haven''t talked to in a while', 'Not a deep conversation — just a "hey, thinking of you."', 5, 1, 3, 'base'),
('Play with a pet', 'If you have one. Full attention, no phone.', 15, 1, 5, 'base'),
('Watch a comfort show episode', 'Something you''ve seen before that makes you feel safe. One episode.', 25, 2, 5, 'base'),
('Listen to music that matches your mood', 'Not to change your mood — to validate it. Make it a deliberate 15 minutes.', 15, 1, 5, 'base'),
('Call or voice-note a friend', 'A real voice connection, even brief.', 10, 1, 3, 'base'),
('Write about how you''re feeling', 'Not a journal practice — just get the current mess out of your head and onto paper.', 10, 3, 5, 'base'),
('Look through photos that make you happy', 'Old trips, pets, friends. Set a timer so you don''t spiral into nostalgia.', 10, 1, 4, 'base'),
('Sit outside and do nothing', 'Literally nothing. Bench, step, balcony. Five minutes of sky.', 5, 3, 5, 'base'),
-- Multi-category
('Do a guided breathing exercise', 'Four counts in, seven counts hold, eight counts out. Three rounds.', 5, 3, 5, 'base'),
('Color in a coloring book', 'The adult kind, or the kids kind — doesn''t matter.', 20, 1, 4, 'base')
ON CONFLICT DO NOTHING;

-- Link activities to categories

-- Head
INSERT INTO activity_categories (activity_id, category_id)
SELECT a.id, c.id FROM activities a, categories c
WHERE a.source = 'base' AND c.name = 'Head' AND a.title IN (
    'Listen to a podcast episode',
    'Do a crossword or word puzzle',
    'Read a chapter of a book',
    'Watch a short documentary',
    'Write down three things that went well today',
    'Organize one small digital space',
    'Learn five words in a new language',
    'Play a simple strategy game',
    'Do a guided breathing exercise',
    'Color in a coloring book'
)
ON CONFLICT DO NOTHING;

-- Hands
INSERT INTO activity_categories (activity_id, category_id)
SELECT a.id, c.id FROM activities a, categories c
WHERE a.source = 'base' AND c.name = 'Hands' AND a.title IN (
    'Go for a walk around the block',
    'Stretch for ten minutes',
    'Doodle or sketch something',
    'Tidy one surface in your home',
    'Cook or prepare a simple snack',
    'Water your plants',
    'Do a short bodyweight workout',
    'Dance to three songs',
    'Take a shower or bath',
    'Sit outside and do nothing',
    'Do a guided breathing exercise',
    'Color in a coloring book'
)
ON CONFLICT DO NOTHING;

-- Heart
INSERT INTO activity_categories (activity_id, category_id)
SELECT a.id, c.id FROM activities a, categories c
WHERE a.source = 'base' AND c.name = 'Heart' AND a.title IN (
    'Text someone you haven''t talked to in a while',
    'Play with a pet',
    'Watch a comfort show episode',
    'Listen to music that matches your mood',
    'Call or voice-note a friend',
    'Write about how you''re feeling',
    'Look through photos that make you happy',
    'Sit outside and do nothing'
)
ON CONFLICT DO NOTHING;


-- This is a cross join with a filter. 

--   It's a common pattern for populating junction tables when you know the names but not the IDs (since the IDs are generated     
--   UUIDs/serials). An alternative way to write the same thing with an explicit JOIN:

--   SELECT a.id, c.id
--   FROM activities a
--   JOIN categories c ON c.name = 'Head'
--   WHERE a.source = 'base' AND a.title IN (...)

--   Same result, just more explicit about the join.