-- Update contacts table: Set 회사 to 'MBC Plus' where 담당 contains 'mbc+' or 'liveU'

UPDATE public.contacts
SET "회사" = 'MBC Plus'
WHERE "담당" ILIKE '%mbc+%' OR "담당" ILIKE '%liveU%';