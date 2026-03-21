-- Enable pg_trgm for fuzzy search and GIN indexing
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable fuzzystrmatch for Levenshtein distance
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;

-- Enable vector extension MUST be installed
CREATE EXTENSION IF NOT EXISTS vector;
