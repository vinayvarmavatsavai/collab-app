import { MigrationInterface, QueryRunner } from "typeorm";

export class EnablePgTrgm1700000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pg_trgm"');
        await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "fuzzystrmatch"');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // We generally don't want to disable extensions in down migrations as other things might depend on them
        // but for completeness:
        // await queryRunner.query('DROP EXTENSION IF EXISTS "pg_trgm"');
        // await queryRunner.query('DROP EXTENSION IF EXISTS "fuzzystrmatch"');
    }
}
