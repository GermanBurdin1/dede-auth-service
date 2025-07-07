import { MigrationInterface, QueryRunner } from "typeorm";

export class IsEmailConfirmed1751815197153 implements MigrationInterface {
    name = 'IsEmailConfirmed1751815197153'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "is_email_confirmed" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "email_confirm_token" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_confirm_token"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_email_confirmed"`);
    }
}
