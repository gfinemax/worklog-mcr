-- Reorder workers JSONB keys from: video, director, assistant
-- To: director, assistant, video

-- Preview affected rows first (optional)
-- SELECT id, workers FROM worklogs WHERE workers IS NOT NULL LIMIT 5;

-- Execute update
UPDATE worklogs
SET workers = jsonb_build_object(
  'director', COALESCE(workers->'director', '[]'::jsonb),
  'assistant', COALESCE(workers->'assistant', '[]'::jsonb),
  'video', COALESCE(workers->'video', '[]'::jsonb)
)
WHERE workers IS NOT NULL;

-- Verify change (optional)
-- SELECT id, workers FROM worklogs WHERE workers IS NOT NULL LIMIT 5;
