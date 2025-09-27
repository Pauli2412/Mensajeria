-- 1) Normaliza todos los teléfonos existentes
UPDATE "User"
SET phone = regexp_replace(phone, '\D', '', 'g')
WHERE phone IS NOT NULL;

-- 2) Función para normalizar siempre antes de INSERT/UPDATE
CREATE OR REPLACE FUNCTION normalize_phone()
RETURNS TRIGGER AS $$
BEGIN
  NEW.phone := regexp_replace(NEW.phone, '\D', '', 'g');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3) Elimina trigger previo si existía
DROP TRIGGER IF EXISTS normalize_phone_trigger ON "User";

-- 4) Crea trigger
CREATE TRIGGER normalize_phone_trigger
BEFORE INSERT OR UPDATE ON "User"
FOR EACH ROW
EXECUTE FUNCTION normalize_phone();

-- 5) Índice único sobre teléfonos normalizados
DROP INDEX IF EXISTS idx_users_phone_digits;

CREATE UNIQUE INDEX idx_users_phone_digits
ON "User" ((regexp_replace(phone, '\D', '', 'g')));
