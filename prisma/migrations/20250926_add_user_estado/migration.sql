-- Agregar columna "estado" a la tabla "User"
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "estado" TEXT NOT NULL DEFAULT 'pendiente';

-- Crear índice para búsquedas rápidas por estado
CREATE INDEX IF NOT EXISTS "idx_user_estado" ON "User"("estado");
