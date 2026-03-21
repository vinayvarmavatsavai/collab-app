-- Migration: Vector-Based Matching System
-- Description: Add pgvector extension and create tables for collaboration matching
-- Author: System
-- Date: 2026-02-12

-- ============================================
-- 1. Enable pgvector Extension
-- ============================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- 2. User Profile Vectors Table
-- ============================================

CREATE TABLE IF NOT EXISTS user_profile_vectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    embedding vector(3072),  -- Llama 3.2 3B dimension (was 1536 for OpenAI)
    summary_text TEXT NOT NULL,  -- Deterministic summary used for embedding
    metadata JSONB DEFAULT '{}',  -- {skills: [], domains: []} for quick filtering
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_user_profile_vector UNIQUE(user_profile_id)
);

-- Indexes for user_profile_vectors
CREATE INDEX IF NOT EXISTS idx_user_profile_vectors_embedding 
ON user_profile_vectors USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_user_profile_vectors_metadata 
ON user_profile_vectors USING GIN(metadata);

CREATE INDEX IF NOT EXISTS idx_user_profile_vectors_user 
ON user_profile_vectors(user_profile_id);

-- ============================================
-- 3. Milestone Vectors Table
-- ============================================

CREATE TABLE IF NOT EXISTS milestone_vectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    embedding vector(3072),
    content_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_milestone_post UNIQUE(post_id)
);

-- Indexes for milestone_vectors
CREATE INDEX IF NOT EXISTS idx_milestone_vectors_user_date 
ON milestone_vectors(user_profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_milestone_vectors_embedding 
ON milestone_vectors USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- 4. Project Requests Table
-- ============================================

CREATE TABLE IF NOT EXISTS project_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    required_skills TEXT[] NOT NULL DEFAULT '{}',
    required_domains TEXT[] NOT NULL DEFAULT '{}',
    optional_skills TEXT[] DEFAULT '{}',
    preferred_experience_level VARCHAR(50),  -- junior, mid, senior, any
    max_cohort_size INT DEFAULT 5,
    status VARCHAR(50) DEFAULT 'open',  -- open, matching, in_progress, completed, cancelled
    embedding vector(3072),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    matching_completed_at TIMESTAMP,
    cohort_formed_at TIMESTAMP,
    completed_at TIMESTAMP
);

-- Indexes for project_requests
CREATE INDEX IF NOT EXISTS idx_project_requests_creator 
ON project_requests(creator_id);

CREATE INDEX IF NOT EXISTS idx_project_requests_status 
ON project_requests(status);

CREATE INDEX IF NOT EXISTS idx_project_requests_created 
ON project_requests(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_requests_embedding 
ON project_requests USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================
-- 5. Project Interests Table
-- ============================================

CREATE TABLE IF NOT EXISTS project_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES project_requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    interest_text TEXT NOT NULL,
    attachment_urls TEXT[] DEFAULT '{}',
    relevance_score FLOAT,  -- Computed similarity score from matching
    profile_similarity FLOAT,  -- Individual score components for transparency
    milestone_similarity FLOAT,
    skill_overlap FLOAT,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_project_user_interest UNIQUE(project_id, user_id)
);

-- Indexes for project_interests
CREATE INDEX IF NOT EXISTS idx_project_interests_project_score 
ON project_interests(project_id, relevance_score DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_project_interests_user 
ON project_interests(user_id, created_at DESC);

-- ============================================
-- 6. Cohorts Table
-- ============================================

CREATE TABLE IF NOT EXISTS cohorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES project_requests(id) ON DELETE CASCADE,
    member_ids UUID[] NOT NULL,
    status VARCHAR(50) DEFAULT 'active',  -- active, completed, disbanded
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    disbanded_at TIMESTAMP,
    CONSTRAINT unique_project_cohort UNIQUE(project_id)
);

-- Indexes for cohorts
CREATE INDEX IF NOT EXISTS idx_cohorts_project 
ON cohorts(project_id);

CREATE INDEX IF NOT EXISTS idx_cohorts_members 
ON cohorts USING GIN(member_ids);

CREATE INDEX IF NOT EXISTS idx_cohorts_status 
ON cohorts(status);

-- ============================================
-- 7. Project Notifications Table
-- ============================================

CREATE TABLE IF NOT EXISTS project_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES project_requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) DEFAULT 'match',  -- match, selected, rejected
    notified_at TIMESTAMP DEFAULT NOW(),
    viewed_at TIMESTAMP,
    CONSTRAINT unique_project_user_notification UNIQUE(project_id, user_id, notification_type)
);

-- Indexes for project_notifications
CREATE INDEX IF NOT EXISTS idx_project_notifications_user_date 
ON project_notifications(user_id, notified_at DESC);

CREATE INDEX IF NOT EXISTS idx_project_notifications_project 
ON project_notifications(project_id);

CREATE INDEX IF NOT EXISTS idx_project_notifications_viewed 
ON project_notifications(user_id, viewed_at) WHERE viewed_at IS NULL;

-- ============================================
-- 8. Triggers for updated_at timestamps
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for user_profile_vectors
CREATE TRIGGER update_user_profile_vectors_updated_at 
BEFORE UPDATE ON user_profile_vectors
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for project_requests
CREATE TRIGGER update_project_requests_updated_at 
BEFORE UPDATE ON project_requests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. Comments for documentation
-- ============================================

COMMENT ON TABLE user_profile_vectors IS 'Stores vector embeddings of user profiles for similarity matching';
COMMENT ON TABLE milestone_vectors IS 'Stores vector embeddings of user posts/milestones (last 20 per user)';
COMMENT ON TABLE project_requests IS 'Collaboration project requests created by users';
COMMENT ON TABLE project_interests IS 'User submissions expressing interest in projects';
COMMENT ON TABLE cohorts IS 'Formed collaboration groups';
COMMENT ON TABLE project_notifications IS 'Tracks which users were notified about projects';

COMMENT ON COLUMN user_profile_vectors.embedding IS 'Vector embedding (1536 dimensions for OpenAI ada-002)';
COMMENT ON COLUMN user_profile_vectors.summary_text IS 'Deterministic text summary used to generate embedding';
COMMENT ON COLUMN user_profile_vectors.metadata IS 'JSON containing skills and domains for hard filtering';

COMMENT ON COLUMN project_interests.relevance_score IS 'Final hybrid score: 0.6*profile + 0.25*milestone + 0.15*skill';
