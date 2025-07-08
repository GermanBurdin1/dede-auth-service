import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveRedundantFields1752000000000 implements MigrationInterface {
    name = 'RemoveRedundantFields1752000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Удаляем избыточное поле current_role (дублирует функциональность roles array)
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "current_role"`);
        
        // Удаляем поля email confirmation (не используются в процессе авторизации)
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "email_confirm_token"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "is_email_confirmed"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Восстанавливаем поля в случае отката
        await queryRunner.query(`ALTER TABLE "users" ADD "current_role" character varying NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD "is_email_confirmed" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "email_confirm_token" character varying NULL`);
    }
} 