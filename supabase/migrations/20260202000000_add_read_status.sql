-- Add read status column to emails table
ALTER TABLE emails 
ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;

-- Create index for faster queries on read status
CREATE INDEX IF NOT EXISTS idx_emails_read ON emails(read);
