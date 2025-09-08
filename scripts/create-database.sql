-- Crear tabla para elementos multimedia
CREATE TABLE IF NOT EXISTS media_items (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  title TEXT NOT NULL,
  uploader_id TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para ordenar por fecha
CREATE INDEX IF NOT EXISTS idx_media_items_added_at ON media_items(added_at DESC);

-- Índice para buscar por uploader
CREATE INDEX IF NOT EXISTS idx_media_items_uploader ON media_items(uploader_id);

-- Índice para ordenar por visitas
CREATE INDEX IF NOT EXISTS idx_media_items_views ON media_items(views DESC);
