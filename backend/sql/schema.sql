-- Create Domains Table (Replaces Categories)
CREATE TABLE IF NOT EXISTS domains (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name character varying(100) NOT NULL UNIQUE,
    normalized_name character varying(100) NOT NULL UNIQUE,
    parent_domain_id uuid REFERENCES domains(id) ON DELETE SET NULL,
    description text,
    embedding vector(768),
    usage_count integer DEFAULT 0 NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    created_by_user_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

-- Indexing Domains
CREATE INDEX IF NOT EXISTS idx_domains_normalized ON domains (normalized_name);
CREATE INDEX IF NOT EXISTS idx_domains_trgm ON domains USING gin (normalized_name gin_trgm_ops);


-- Create canonical_skills table
CREATE TABLE IF NOT EXISTS canonical_skills (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name character varying(100) NOT NULL UNIQUE,
    normalized_name character varying(100) NOT NULL UNIQUE,
    primary_domain_id uuid NOT NULL REFERENCES domains(id) ON DELETE RESTRICT,
    description text,
    embedding vector(768),
    usage_count integer DEFAULT 0 NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    created_by_user_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

-- Indexing Skills
CREATE INDEX IF NOT EXISTS idx_canonical_skills_normalized ON canonical_skills (normalized_name);
CREATE INDEX IF NOT EXISTS idx_canonical_skills_primary_domain ON canonical_skills (primary_domain_id);
CREATE INDEX IF NOT EXISTS idx_canonical_skills_trgm ON canonical_skills USING gin (normalized_name gin_trgm_ops);


-- Create professional_roles table
CREATE TABLE IF NOT EXISTS professional_roles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name character varying(100) NOT NULL UNIQUE,
    normalized_name character varying(100) NOT NULL UNIQUE,
    primary_domain_id uuid NOT NULL REFERENCES domains(id) ON DELETE RESTRICT,
    description text,
    embedding vector(768),
    usage_count integer DEFAULT 0 NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    created_by_user_id uuid,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);

-- Indexing Roles
CREATE INDEX IF NOT EXISTS idx_roles_normalized ON professional_roles (normalized_name);
CREATE INDEX IF NOT EXISTS idx_roles_primary_domain ON professional_roles (primary_domain_id);
CREATE INDEX IF NOT EXISTS idx_roles_trgm ON professional_roles USING gin (normalized_name gin_trgm_ops);


-- Many-to-Many Linking Tables for Secondary Domains
CREATE TABLE IF NOT EXISTS skill_additional_domains (
    skill_id uuid REFERENCES canonical_skills(id) ON DELETE CASCADE,
    domain_id uuid REFERENCES domains(id) ON DELETE CASCADE,
    PRIMARY KEY(skill_id, domain_id)
);

CREATE TABLE IF NOT EXISTS role_additional_domains (
    role_id uuid REFERENCES professional_roles(id) ON DELETE CASCADE,
    domain_id uuid REFERENCES domains(id) ON DELETE CASCADE,
    PRIMARY KEY(role_id, domain_id)
);

-- Alias Tables
CREATE TABLE IF NOT EXISTS skill_aliases (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    alias character varying(100) NOT NULL,
    normalized_alias character varying(100) NOT NULL UNIQUE,
    canonical_skill_id uuid NOT NULL REFERENCES canonical_skills(id) ON DELETE CASCADE,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS domain_aliases (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    alias character varying(100) NOT NULL,
    normalized_alias character varying(100) NOT NULL UNIQUE,
    domain_id uuid NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS role_aliases (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    alias character varying(100) NOT NULL,
    normalized_alias character varying(100) NOT NULL UNIQUE,
    professional_role_id uuid NOT NULL REFERENCES professional_roles(id) ON DELETE CASCADE,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);
