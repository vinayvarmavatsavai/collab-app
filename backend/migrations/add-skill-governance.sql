-- Add production-hardening columns to canonical_skills
ALTER TABLE canonical_skills
ADD COLUMN IF NOT EXISTS confidence_level VARCHAR(20) DEFAULT 'high',
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'user';

-- Create skill_review_queue table
CREATE TABLE IF NOT EXISTS skill_review_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_input VARCHAR(100) NOT NULL,
    normalized_input VARCHAR(100) NOT NULL,
    suggested_skill_id UUID REFERENCES canonical_skills(id) ON DELETE CASCADE,
    fuzzy_similarity FLOAT,
    status VARCHAR(20) DEFAULT 'pending',
    created_by_user_id UUID,
    reviewed_by_admin_id UUID,
    review_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    reviewed_at TIMESTAMP
);

-- Create indexes for skill_review_queue
CREATE INDEX IF NOT EXISTS idx_skill_review_status ON skill_review_queue(status);
CREATE INDEX IF NOT EXISTS idx_skill_review_created ON skill_review_queue(created_at);

-- Update seeded skills to be verified
UPDATE canonical_skills
SET is_verified = true,
    confidence_level = 'high',
    source = 'seed'
WHERE source = 'user' OR source IS NULL;

-- Print summary
SELECT 
    'Canonical Skills' as table_name,
    COUNT(*) as total,
    SUM(CASE WHEN is_verified THEN 1 ELSE 0 END) as verified,
    SUM(CASE WHEN confidence_level = 'high' THEN 1 ELSE 0 END) as high_confidence
FROM canonical_skills
UNION ALL
SELECT 
    'Review Queue' as table_name,
    COUNT(*) as total,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved
FROM skill_review_queue;
