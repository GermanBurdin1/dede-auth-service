import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTeacherProfile1748768640883 implements MigrationInterface {
    name = 'AddTeacherProfile1748768640883'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "teacher_profiles" ("id_teacher_profile" uuid NOT NULL DEFAULT uuid_generate_v4(), "photo_url" character varying, "bio" text, "experience_years" integer, "rating" double precision, "review_count" integer, "price" integer, "user_id" uuid, CONSTRAINT "REL_b9627de400103265c502c57b56" UNIQUE ("user_id"), CONSTRAINT "PK_8596a905d834578aebf155dfe04" PRIMARY KEY ("id_teacher_profile"))`);
        await queryRunner.query(`CREATE TABLE "teacher_specializations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "specialization" character varying NOT NULL, "teacher_profile_id" uuid, CONSTRAINT "PK_fb95a12c1c20703061e293bee17" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "teacher_certificates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "certificate_url" character varying NOT NULL, "teacher_profile_id" uuid, CONSTRAINT "PK_d79c859ed5a3619f48f5a68996f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "teacher_profiles" ADD CONSTRAINT "FK_b9627de400103265c502c57b56b" FOREIGN KEY ("user_id") REFERENCES "users"("id_users") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "teacher_specializations" ADD CONSTRAINT "FK_2cfc6e196d77a82fb5c3f9e9891" FOREIGN KEY ("teacher_profile_id") REFERENCES "teacher_profiles"("id_teacher_profile") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "teacher_certificates" ADD CONSTRAINT "FK_3675a170b1f6c6cc7d883192212" FOREIGN KEY ("teacher_profile_id") REFERENCES "teacher_profiles"("id_teacher_profile") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "teacher_certificates" DROP CONSTRAINT "FK_3675a170b1f6c6cc7d883192212"`);
        await queryRunner.query(`ALTER TABLE "teacher_specializations" DROP CONSTRAINT "FK_2cfc6e196d77a82fb5c3f9e9891"`);
        await queryRunner.query(`ALTER TABLE "teacher_profiles" DROP CONSTRAINT "FK_b9627de400103265c502c57b56b"`);
        await queryRunner.query(`DROP TABLE "teacher_certificates"`);
        await queryRunner.query(`DROP TABLE "teacher_specializations"`);
        await queryRunner.query(`DROP TABLE "teacher_profiles"`);
    }

}
