/*
# Fix reading_plan unique constraint

The reading_plan table had UNIQUE(day_number), but some days span multiple books
(e.g., Day 8: Genesis 50 + Exodus 1-6). This removes the single-column unique
constraint and adds a composite one on (day_number, book).
*/

-- Drop the single-column unique constraint
ALTER TABLE reading_plan DROP CONSTRAINT IF EXISTS reading_plan_day_number_key;

-- Add composite unique constraint
ALTER TABLE reading_plan ADD CONSTRAINT reading_plan_day_book_key UNIQUE (day_number, book);
