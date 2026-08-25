-- Snaps: fotos y videos que se ven una vez
ALTER TABLE "messages" ADD COLUMN "ephemeral" BOOLEAN NOT NULL DEFAULT false;

-- Quién ya abrió cada Snap (por participante, para que sirva en grupos)
CREATE TABLE "message_views" (
    "messageId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "message_views_pkey" PRIMARY KEY ("messageId","userId")
);

ALTER TABLE "message_views" ADD CONSTRAINT "message_views_messageId_fkey"
    FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "message_views" ADD CONSTRAINT "message_views_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
