import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVisibilityModeToProjectRequests1707820000000 implements MigrationInterface {
    name = 'AddVisibilityModeToProjectRequests1707820000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project_requests" 
            ADD COLUMN "visibility_mode" VARCHAR(20) DEFAULT 'hybrid' 
            CHECK ("visibility_mode" IN ('matching-only', 'open', 'hybrid'))
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "project_requests" 
            DROP COLUMN "visibility_mode"
        `);
    }
}
