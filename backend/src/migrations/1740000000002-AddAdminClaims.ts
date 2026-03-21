import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAdminClaims1740000000002 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Update institution_claims table
        // Drop old columns if they exist (to be safe/clean given it was a stub) or just add new ones.
        // Given it was likely a stub, I will drop and recreate or alter.
        // Analyzing the previous entity file, it had: id, community_id, requested_by, status, evidence, reviewed_by, created_at, reviewed_at.
        // I need to add: reason, officialProfileUrl, contactEmail, contactPhone, proofDocumentUrl, trustScore, rejectionReason, updatedAt.

        await queryRunner.addColumns('institution_claims', [
            new TableColumn({ name: 'reason', type: 'text', isNullable: true }), // Made nullable to avoid issues with existing rows, but code enforces it. Actually, better to default or clear existing.
            new TableColumn({ name: 'officialProfileUrl', type: 'text', isNullable: true }),
            new TableColumn({ name: 'contactEmail', type: 'varchar', isNullable: true }),
            new TableColumn({ name: 'contactPhone', type: 'varchar', isNullable: true }),
            new TableColumn({ name: 'proofDocumentUrl', type: 'text', isNullable: true }),
            new TableColumn({ name: 'trustScore', type: 'int', default: 0 }),
            new TableColumn({ name: 'rejectionReason', type: 'text', isNullable: true }),
            new TableColumn({ name: 'updated_at', type: 'timestamp', default: 'now()' }),
        ]);

        // 2. Update user_profiles table
        await queryRunner.addColumns('user_profiles', [
            new TableColumn({ name: 'riskLevel', type: 'int', default: 0 }),
            new TableColumn({ name: 'failedAdminClaims', type: 'int', default: 0 }),
            new TableColumn({ name: 'lastAdminClaimAt', type: 'timestamp', isNullable: true }),
        ]);

        // 3. Update community_members table
        await queryRunner.addColumns('community_members', [
            new TableColumn({ name: 'role_granted_at', type: 'timestamp', isNullable: true }),
            new TableColumn({ name: 'role_granted_by', type: 'uuid', isNullable: true }),
        ]);

        // Add minimal data integrity update for existing claims if any (optional)
        await queryRunner.query(`UPDATE institution_claims SET "reason" = 'Legacy claim', "officialProfileUrl" = '' WHERE "reason" IS NULL`);

        // Make required columns non-nullable after population
        await queryRunner.query(`ALTER TABLE institution_claims ALTER COLUMN "reason" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE institution_claims ALTER COLUMN "officialProfileUrl" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropColumns('community_members', ['role_granted_at', 'role_granted_by']);

        await queryRunner.dropColumns('user_profiles', ['riskLevel', 'failedAdminClaims', 'lastAdminClaimAt']);

        await queryRunner.dropColumns('institution_claims', [
            'reason',
            'officialProfileUrl',
            'contactEmail',
            'contactPhone',
            'proofDocumentUrl',
            'trustScore',
            'rejectionReason',
            'updated_at'
        ]);
    }
}
