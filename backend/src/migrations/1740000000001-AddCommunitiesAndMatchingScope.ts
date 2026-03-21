
import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCommunitiesAndMatchingScope1740000000001 implements MigrationInterface {
    name = 'AddCommunitiesAndMatchingScope1740000000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Enums
        await queryRunner.query(`CREATE TYPE "public"."community_type_enum" AS ENUM('institution', 'public', 'private')`);
        await queryRunner.query(`CREATE TYPE "public"."governance_mode_enum" AS ENUM('system_managed', 'institution_managed', 'user_managed')`);
        await queryRunner.query(`CREATE TYPE "public"."community_member_role_enum" AS ENUM('member', 'admin', 'owner')`);
        await queryRunner.query(`CREATE TYPE "public"."club_member_role_enum" AS ENUM('member', 'admin')`);
        await queryRunner.query(`CREATE TYPE "public"."institution_claim_status_enum" AS ENUM('PENDING', 'APPROVED', 'REJECTED')`);
        await queryRunner.query(`CREATE TYPE "public"."project_requests_matching_scope_enum" AS ENUM('GLOBAL', 'COMMUNITY', 'CLUB')`);

        // Communities
        await queryRunner.query(`CREATE TABLE "communities" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "slug" character varying NOT NULL, "description" text, "type" "public"."community_type_enum" NOT NULL DEFAULT 'public', "governanceMode" "public"."governance_mode_enum" NOT NULL DEFAULT 'system_managed', "institution_domain" character varying, "owner_id" uuid, "is_institution_verified" boolean NOT NULL DEFAULT false, "verified_at" TIMESTAMP, "avatar" character varying, "cover" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_COMMUNITY_SLUG" UNIQUE ("slug"), CONSTRAINT "PK_COMMUNITY_ID" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_COMMUNITY_TYPE" ON "communities" ("type") `);
        await queryRunner.query(`CREATE INDEX "IDX_COMMUNITY_INT_DOMAIN" ON "communities" ("institution_domain") `);

        // Community Members
        await queryRunner.query(`CREATE TABLE "community_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "community_id" uuid NOT NULL, "user_id" uuid NOT NULL, "role" "public"."community_member_role_enum" NOT NULL DEFAULT 'member', "joined_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_COMMUNITY_MEMBER" UNIQUE ("community_id", "user_id"), CONSTRAINT "PK_COMMUNITY_MEMBER_ID" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_COMMUNITY_MEMBER_USER" ON "community_members" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_COMMUNITY_MEMBER_COMMUNITY" ON "community_members" ("community_id") `);

        // Clubs
        await queryRunner.query(`CREATE TABLE "clubs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "community_id" uuid NOT NULL, "name" character varying NOT NULL, "slug" character varying NOT NULL, "description" text, "created_by" character varying NOT NULL, "avatar" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_CLUB_SLUG" UNIQUE ("community_id", "slug"), CONSTRAINT "PK_CLUB_ID" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_CLUB_COMMUNITY" ON "clubs" ("community_id") `);

        // Club Members
        await queryRunner.query(`CREATE TABLE "club_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "club_id" uuid NOT NULL, "user_id" uuid NOT NULL, "role" "public"."club_member_role_enum" NOT NULL DEFAULT 'member', "joined_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_CLUB_MEMBER" UNIQUE ("club_id", "user_id"), CONSTRAINT "PK_CLUB_MEMBER_ID" PRIMARY KEY ("id"))`);

        // Claims
        await queryRunner.query(`CREATE TABLE "institution_claims" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "community_id" uuid NOT NULL, "requested_by" character varying NOT NULL, "status" "public"."institution_claim_status_enum" NOT NULL DEFAULT 'PENDING', "evidence" jsonb, "reviewed_by" character varying, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "reviewed_at" TIMESTAMP, CONSTRAINT "PK_CLAIM_ID" PRIMARY KEY ("id"))`);

        // Project Requests Update
        await queryRunner.query(`
            ALTER TABLE "project_requests" 
            ADD COLUMN "matching_scope" "public"."project_requests_matching_scope_enum" NOT NULL DEFAULT 'GLOBAL',
            ADD COLUMN "community_ids" uuid array,
            ADD COLUMN "club_ids" uuid array
        `);

        // FKs
        await queryRunner.query(`ALTER TABLE "community_members" ADD CONSTRAINT "FK_COMMUNITY_MEMBER_COMMUNITY" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "community_members" ADD CONSTRAINT "FK_COMMUNITY_MEMBER_USER" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "clubs" ADD CONSTRAINT "FK_CLUB_COMMUNITY" FOREIGN KEY ("community_id") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "club_members" ADD CONSTRAINT "FK_CLUB_MEMBER_CLUB" FOREIGN KEY ("club_id") REFERENCES "clubs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "club_members" ADD CONSTRAINT "FK_CLUB_MEMBER_USER" FOREIGN KEY ("user_id") REFERENCES "user_profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop FKs
        await queryRunner.query(`ALTER TABLE "club_members" DROP CONSTRAINT "FK_CLUB_MEMBER_USER"`);
        await queryRunner.query(`ALTER TABLE "club_members" DROP CONSTRAINT "FK_CLUB_MEMBER_CLUB"`);
        await queryRunner.query(`ALTER TABLE "clubs" DROP CONSTRAINT "FK_CLUB_COMMUNITY"`);
        await queryRunner.query(`ALTER TABLE "community_members" DROP CONSTRAINT "FK_COMMUNITY_MEMBER_USER"`);
        await queryRunner.query(`ALTER TABLE "community_members" DROP CONSTRAINT "FK_COMMUNITY_MEMBER_COMMUNITY"`);

        // Drop Columns
        await queryRunner.query(`ALTER TABLE "project_requests" DROP COLUMN "club_ids"`);
        await queryRunner.query(`ALTER TABLE "project_requests" DROP COLUMN "community_ids"`);
        await queryRunner.query(`ALTER TABLE "project_requests" DROP COLUMN "matching_scope"`);

        // Drop Tables
        await queryRunner.query(`DROP TABLE "institution_claims"`);
        await queryRunner.query(`DROP TABLE "club_members"`);
        await queryRunner.query(`DROP TABLE "clubs"`);
        await queryRunner.query(`DROP TABLE "community_members"`);
        await queryRunner.query(`DROP TABLE "communities"`);

        // Drop Enums
        await queryRunner.query(`DROP TYPE "public"."project_requests_matching_scope_enum"`);
        await queryRunner.query(`DROP TYPE "public"."institution_claim_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."club_member_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."community_member_role_enum"`);
        await queryRunner.query(`DROP TYPE "public"."governance_mode_enum"`);
        await queryRunner.query(`DROP TYPE "public"."community_type_enum"`);
    }
}
