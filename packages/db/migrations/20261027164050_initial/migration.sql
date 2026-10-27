-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "default-schema";

-- CreateTable
CREATE TABLE "default-schema"."users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "user_name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "default-schema"."blog" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "tagLine" TEXT,
    "body" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "user_id" INTEGER NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "default-schema"."product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "stockCount" INTEGER NOT NULL,
    "imageUrl" TEXT NOT NULL,

    CONSTRAINT "product_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "default-schema"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_user_name_key" ON "default-schema"."users"("user_name");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "default-schema"."users"("email");

-- AddForeignKey
ALTER TABLE "default-schema"."blog" ADD CONSTRAINT "blog_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "default-schema"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
