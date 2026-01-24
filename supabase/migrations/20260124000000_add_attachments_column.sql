-- Add attachments column to emails table
alter table public.emails add column if not exists attachments jsonb default '[]'::jsonb;

-- Add resend_email_id column to store Resend's email ID for attachment downloads
alter table public.emails add column if not exists resend_email_id text;
