import { MigrationInterface, QueryRunner } from "typeorm";

export class RestoreEmailConfirmation1753000000000 implements MigrationInterface {
    name = 'RestoreEmailConfirmation1753000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Возвращаем поле is_email_confirmed (нужно для логики подтверждения email)
        await queryRunner.query(`ALTER TABLE "users" ADD "is_email_confirmed" boolean NOT NULL DEFAULT false`);
        
        // НЕ возвращаем email_confirm_token - он действительно не используется
        // Логика подтверждения будет работать через другие механизмы
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Удаляем поле в случае отката
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_email_confirmed"`);
    }
} 