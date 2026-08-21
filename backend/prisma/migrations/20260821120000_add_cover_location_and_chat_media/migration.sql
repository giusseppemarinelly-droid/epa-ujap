-- Portada del perfil
ALTER TABLE "users" ADD COLUMN "coverUrl" TEXT;

-- Ubicación opcional para el mapa de personas (opt-in, apagado por defecto)
ALTER TABLE "users" ADD COLUMN "shareLocation" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "lastLat" DOUBLE PRECISION;
ALTER TABLE "users" ADD COLUMN "lastLng" DOUBLE PRECISION;
ALTER TABLE "users" ADD COLUMN "locationUpdatedAt" TIMESTAMP(3);

-- Fotos y videos en el chat
CREATE TYPE "MessageKind" AS ENUM ('TEXTO', 'IMAGEN', 'VIDEO');
ALTER TABLE "messages" ADD COLUMN "kind" "MessageKind" NOT NULL DEFAULT 'TEXTO';
ALTER TABLE "messages" ADD COLUMN "mediaUrl" TEXT;

-- Rachas de fotos entre dos personas
ALTER TABLE "conversations" ADD COLUMN "streakCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "conversations" ADD COLUMN "streakDate" TIMESTAMP(3);
ALTER TABLE "conversation_participants" ADD COLUMN "lastMediaAt" TIMESTAMP(3);
