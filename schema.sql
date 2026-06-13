-- ENDEL Estudios — Schema D1
-- Ejecutar con: wrangler d1 execute endel-estudios-db --file=schema.sql

CREATE TABLE IF NOT EXISTS tickets (
  code         TEXT PRIMARY KEY,
  email        TEXT NOT NULL,
  estado       TEXT NOT NULL DEFAULT 'pendiente',
  nota_publica TEXT,
  nota_entrega TEXT,
  unlock_code  TEXT,
  fecha        TEXT NOT NULL
);

-- Estados posibles:
-- pendiente    → recien creado, esperando revision
-- en_proceso   → proyecto en desarrollo
-- revision     → esperando aprobacion del cliente
-- entregado    → proyecto terminado y entregado
-- no_autorizado → ticket rechazado
