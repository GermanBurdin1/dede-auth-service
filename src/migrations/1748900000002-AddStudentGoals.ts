import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStudentGoals1748900000002 implements MigrationInterface {
    name = 'AddStudentGoals1748900000002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "student_goals" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "studentId" uuid NOT NULL,
                "examLevel" character varying NOT NULL,
                "targetDate" TIMESTAMP,
                "description" text,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_student_goals" PRIMARY KEY ("id"),
                CONSTRAINT "FK_student_goals_studentId" FOREIGN KEY ("studentId") REFERENCES "users"("id_users") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_student_goals_studentId" ON "student_goals" ("studentId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_student_goals_examLevel" ON "student_goals" ("examLevel")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_student_goals_examLevel"`);
        await queryRunner.query(`DROP INDEX "IDX_student_goals_studentId"`);
        await queryRunner.query(`DROP TABLE "student_goals"`);
    }
} 