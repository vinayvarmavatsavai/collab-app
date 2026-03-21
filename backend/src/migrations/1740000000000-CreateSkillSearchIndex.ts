import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSkillSearchIndex1740000000000 implements MigrationInterface {
    name = 'CreateSkillSearchIndex1740000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enable pg_trgm extension
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

        // Create GIN index for fuzzy matching on canonical_skills
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_canonical_skills_trgm 
            ON canonical_skills 
            USING gin (normalized_name gin_trgm_ops)
        `);

        // Create GIN index for skill_aliases
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS idx_skill_aliases_trgm 
            ON skill_aliases 
            USING gin (normalized_alias gin_trgm_ops)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_skill_aliases_trgm`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_canonical_skills_trgm`);
        // We usually don't drop the extension as other parts might use it, but strictly:
        // await queryRunner.query(`DROP EXTENSION IF EXISTS pg_trgm`);
    }
}
