import { MigrationInterface, QueryRunner } from "typeorm";

export class AddClubMemberStatus1740000000003 implements MigrationInterface {
    name = 'AddClubMemberStatus1740000000003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create ENUM type
        await queryRunner.query(`CREATE TYPE "public"."club_members_status_enum" AS ENUM('pending', 'active', 'rejected')`);

        // Add column with default value 'pending'
        // Note: For existing rows, we might want to backfill to 'active' if they were previously assumed active.
        // Assuming current members are active.
        await queryRunner.query(`ALTER TABLE "club_members" ADD "status" "public"."club_members_status_enum" NOT NULL DEFAULT 'pending'`);

        // Update existing records to 'active' so current members don't get locked out
        await queryRunner.query(`UPDATE "club_members" SET "status" = 'active'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "club_members" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."club_members_status_enum"`);
    }
}
