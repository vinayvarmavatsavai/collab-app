-- Enable pg_trgm extension for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create canonical_skills table
CREATE TABLE IF NOT EXISTS canonical_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    normalized_name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50),
    description TEXT,
    embedding VECTOR(768),
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for canonical_skills
CREATE INDEX IF NOT EXISTS idx_canonical_skills_normalized ON canonical_skills(normalized_name);
CREATE INDEX IF NOT EXISTS idx_canonical_skills_category ON canonical_skills(category);
CREATE INDEX IF NOT EXISTS idx_canonical_skills_trgm ON canonical_skills USING gin (normalized_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_canonical_skills_embedding ON canonical_skills 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create skill_aliases table
CREATE TABLE IF NOT EXISTS skill_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    canonical_skill_id UUID NOT NULL REFERENCES canonical_skills(id) ON DELETE CASCADE,
    alias VARCHAR(100) NOT NULL,
    normalized_alias VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for skill_aliases
CREATE INDEX IF NOT EXISTS idx_skill_aliases_normalized ON skill_aliases(normalized_alias);
CREATE INDEX IF NOT EXISTS idx_skill_aliases_canonical ON skill_aliases(canonical_skill_id);

-- Create user_skills table
CREATE TABLE IF NOT EXISTS user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_profile_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    canonical_skill_id UUID NOT NULL REFERENCES canonical_skills(id) ON DELETE CASCADE,
    proficiency INTEGER CHECK (proficiency BETWEEN 1 AND 5),
    years_experience DECIMAL(3,1),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_profile_id, canonical_skill_id)
);

-- Create indexes for user_skills
CREATE INDEX IF NOT EXISTS idx_user_skills_user ON user_skills(user_profile_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill ON user_skills(canonical_skill_id);

-- Create project_required_skills table
CREATE TABLE IF NOT EXISTS project_required_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES project_requests(id) ON DELETE CASCADE,
    canonical_skill_id UUID NOT NULL REFERENCES canonical_skills(id) ON DELETE CASCADE,
    importance INTEGER DEFAULT 5 CHECK (importance BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(project_id, canonical_skill_id)
);

-- Create indexes for project_required_skills
CREATE INDEX IF NOT EXISTS idx_project_required_skills_project ON project_required_skills(project_id);
CREATE INDEX IF NOT EXISTS idx_project_required_skills_skill ON project_required_skills(canonical_skill_id);

-- Create project_optional_skills table
CREATE TABLE IF NOT EXISTS project_optional_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES project_requests(id) ON DELETE CASCADE,
    canonical_skill_id UUID NOT NULL REFERENCES canonical_skills(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(project_id, canonical_skill_id)
);

-- Create indexes for project_optional_skills
CREATE INDEX IF NOT EXISTS idx_project_optional_skills_project ON project_optional_skills(project_id);
CREATE INDEX IF NOT EXISTS idx_project_optional_skills_skill ON project_optional_skills(canonical_skill_id);
