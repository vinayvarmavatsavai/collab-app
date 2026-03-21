-- Create Professional Roles Tables

-- ENUMS for Roles
CREATE TYPE role_category_enum AS ENUM (
    'engineering', 'design', 'product', 'marketing', 'sales', 
    'finance', 'operations', 'hr', 'legal', 'executive', 'support', 'other'
);

CREATE TYPE role_confidence_level_enum AS ENUM (
    'high', 'medium', 'low', 'user_generated'
);

CREATE TYPE role_source_enum AS ENUM (
    'seed', 'admin', 'user', 'import', 'auto_merged'
);

CREATE TYPE role_review_status_enum AS ENUM (
    'pending', 'approved', 'rejected', 'ignored'
);

-- Professional Roles Table
CREATE TABLE professional_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    normalized_name VARCHAR(100) UNIQUE NOT NULL,
    category role_category_enum,
    description TEXT,
    embedding vector(768),
    usage_count INTEGER DEFAULT 0,
    confidence_level role_confidence_level_enum DEFAULT 'high',
    is_verified BOOLEAN DEFAULT false,
    source role_source_enum DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_roles_normalized ON professional_roles(normalized_name);
CREATE INDEX idx_roles_category ON professional_roles(category);

-- Role Aliases Table
CREATE TABLE role_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_role_id UUID NOT NULL REFERENCES professional_roles(id) ON DELETE CASCADE,
    alias VARCHAR NOT NULL,
    normalized_alias VARCHAR UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_role_aliases_normalized ON role_aliases(normalized_alias);

-- Role Review Queue Table
CREATE TABLE role_review_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_input VARCHAR NOT NULL,
    normalized_input VARCHAR NOT NULL,
    suggested_role_id UUID NOT NULL,
    fuzzy_similarity FLOAT NOT NULL,
    status role_review_status_enum DEFAULT 'pending',
    created_by_user_id UUID,
    reviewed_by_admin_id UUID,
    review_notes TEXT,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_role_review_status ON role_review_queue(status);


-- Create Domain Tables

-- ENUMS for Domains
CREATE TYPE domain_category_enum AS ENUM (
    'industry', 'sector', 'topic', 'other'
);

CREATE TYPE domain_confidence_level_enum AS ENUM (
    'high', 'medium', 'low', 'user_generated'
);

CREATE TYPE domain_source_enum AS ENUM (
    'seed', 'admin', 'user', 'import', 'auto_merged'
);

CREATE TYPE domain_review_status_enum AS ENUM (
    'pending', 'approved', 'rejected', 'ignored'
);

-- Domains Table
CREATE TABLE domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    normalized_name VARCHAR(100) UNIQUE NOT NULL,
    category domain_category_enum,
    description TEXT,
    embedding vector(768),
    usage_count INTEGER DEFAULT 0,
    confidence_level domain_confidence_level_enum DEFAULT 'high',
    is_verified BOOLEAN DEFAULT false,
    source domain_source_enum DEFAULT 'user',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_domains_normalized ON domains(normalized_name);
CREATE INDEX idx_domains_category ON domains(category);

-- Domain Aliases Table
CREATE TABLE domain_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    alias VARCHAR NOT NULL,
    normalized_alias VARCHAR UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_domain_aliases_normalized ON domain_aliases(normalized_alias);

-- Domain Review Queue Table
CREATE TABLE domain_review_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_input VARCHAR NOT NULL,
    normalized_input VARCHAR NOT NULL,
    suggested_domain_id UUID NOT NULL,
    fuzzy_similarity FLOAT NOT NULL,
    status domain_review_status_enum DEFAULT 'pending',
    created_by_user_id UUID,
    reviewed_by_admin_id UUID,
    review_notes TEXT,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_domain_review_status ON domain_review_queue(status);
