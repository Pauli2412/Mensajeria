/*
  Warnings:

  - You are about to drop the column `createdAt` on the `ApiToken` table. All the data in the column will be lost.
  - You are about to drop the column `expiresAt` on the `ApiToken` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `ApiToken` table. All the data in the column will be lost.
  - You are about to drop the column `message` on the `Complaint` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Complaint` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Complaint` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Complaint` table. All the data in the column will be lost.
  - You are about to drop the column `lastMessageAt` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `Deposit` table. All the data in the column will be lost.
  - You are about to drop the column `payerCuil` on the `Deposit` table. All the data in the column will be lost.
  - You are about to drop the column `payerPhone` on the `Deposit` table. All the data in the column will be lost.
  - You are about to drop the column `platform` on the `Deposit` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Deposit` table. All the data in the column will be lost.
  - You are about to drop the column `telepagosRef` on the `Deposit` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Deposit` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `sender` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `text` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `PlatformAccount` table. All the data in the column will be lost.
  - You are about to drop the column `platform` on the `PlatformAccount` table. All the data in the column will be lost.
  - You are about to drop the column `platformUsername` on the `PlatformAccount` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `PlatformAccount` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `AdminUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SyncRun` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[telefono]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `estado` to the `Complaint` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mensaje` to the `Complaint` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estado` to the `Conversation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estado` to the `Deposit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `monto` to the `Deposit` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contenido` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `rol` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `handle` to the `PlatformAccount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipo` to the `PlatformAccount` table without a default value. This is not possible if the table is not empty.
  - Added the required column `telefono` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Deposit_telepagosRef_key";

-- DropIndex
DROP INDEX "public"."PlatformAccount_userId_platform_key";

-- DropIndex
DROP INDEX "public"."User_phone_key";

-- AlterTable
ALTER TABLE "public"."ApiToken" DROP COLUMN "createdAt",
DROP COLUMN "expiresAt",
DROP COLUMN "type",
ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "public"."Complaint" DROP COLUMN "message",
DROP COLUMN "phone",
DROP COLUMN "status",
DROP COLUMN "updatedAt",
ADD COLUMN     "estado" TEXT NOT NULL,
ADD COLUMN     "mensaje" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Conversation" DROP COLUMN "lastMessageAt",
DROP COLUMN "status",
DROP COLUMN "updatedAt",
ADD COLUMN     "estado" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."Deposit" DROP COLUMN "amount",
DROP COLUMN "payerCuil",
DROP COLUMN "payerPhone",
DROP COLUMN "platform",
DROP COLUMN "status",
DROP COLUMN "telepagosRef",
DROP COLUMN "updatedAt",
ADD COLUMN     "estado" TEXT NOT NULL,
ADD COLUMN     "monto" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "public"."Message" DROP COLUMN "metadata",
DROP COLUMN "sender",
DROP COLUMN "text",
ADD COLUMN     "contenido" TEXT NOT NULL,
ADD COLUMN     "rol" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."PlatformAccount" DROP COLUMN "createdAt",
DROP COLUMN "platform",
DROP COLUMN "platformUsername",
DROP COLUMN "updatedAt",
ADD COLUMN     "handle" TEXT NOT NULL,
ADD COLUMN     "tipo" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "createdAt",
DROP COLUMN "name",
DROP COLUMN "phone",
ADD COLUMN     "nombre" TEXT,
ADD COLUMN     "plataformas" TEXT,
ADD COLUMN     "telefono" TEXT NOT NULL;

-- DropTable
DROP TABLE "public"."AdminUser";

-- DropTable
DROP TABLE "public"."SyncRun";

-- DropEnum
DROP TYPE "public"."ComplaintStatus";

-- DropEnum
DROP TYPE "public"."ConversationStatus";

-- DropEnum
DROP TYPE "public"."DepositStatus";

-- DropEnum
DROP TYPE "public"."MessageSender";

-- DropEnum
DROP TYPE "public"."Platform";

-- DropEnum
DROP TYPE "public"."SyncKind";

-- DropEnum
DROP TYPE "public"."SyncStatus";

-- DropEnum
DROP TYPE "public"."TokenType";

-- CreateIndex
CREATE UNIQUE INDEX "User_telefono_key" ON "public"."User"("telefono");
