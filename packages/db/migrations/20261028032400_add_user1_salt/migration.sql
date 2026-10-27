ALTER TABLE "karan-cloudworx"."users1"
ADD COLUMN "salt" TEXT NOT NULL DEFAULT '';

ALTER TABLE "karan-cloudworx"."users1"
ALTER COLUMN "salt" DROP DEFAULT;
