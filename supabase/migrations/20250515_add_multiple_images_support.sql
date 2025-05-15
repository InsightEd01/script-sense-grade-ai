-- Add support for multiple images per answer script
ALTER TABLE answer_scripts
ADD COLUMN additional_image_urls text[] DEFAULT '{}',
ADD COLUMN page_count integer DEFAULT 1,
ADD COLUMN page_order integer[] DEFAULT '{}';

-- Add index for page_count for efficient filtering
CREATE INDEX idx_answer_scripts_page_count ON answer_scripts(page_count);

-- Update existing records
UPDATE answer_scripts
SET page_count = 1
WHERE page_count IS NULL;

COMMENT ON COLUMN answer_scripts.additional_image_urls IS 'Array of URLs for additional pages of the answer script';
COMMENT ON COLUMN answer_scripts.page_count IS 'Total number of pages in this answer script';
COMMENT ON COLUMN answer_scripts.page_order IS 'Array of integers representing the order of pages';
