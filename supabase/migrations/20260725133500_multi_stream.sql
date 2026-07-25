-- 1. Eliminar o renombrar la tabla stream_estado obsoleta
DROP TABLE IF EXISTS stream_estado;

-- 2. Crear la nueva tabla streams con soporte para múltiples transmisiones
CREATE TABLE IF NOT EXISTS streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    titulo TEXT NOT NULL DEFAULT 'Transmisión Privada',
    is_live BOOLEAN NOT NULL DEFAULT false,
    mux_stream_id TEXT,
    mux_playback_id TEXT,
    stream_key TEXT,
    escenario_id TEXT NOT NULL DEFAULT 'estadio',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexar creador del stream para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_streams_created_by ON streams(created_by);

-- 3. Actualizar tablas dependientes

-- chat_mensajes: Añadir stream_id
ALTER TABLE chat_mensajes ADD COLUMN IF NOT EXISTS stream_id UUID REFERENCES streams(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_chat_mensajes_stream_id ON chat_mensajes(stream_id);

-- reacciones_tribuna: Asegurar existencia, remover room_id e insertar stream_id
CREATE TABLE IF NOT EXISTS reacciones_tribuna (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    tipo_reaccion TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Eliminar room_id si existiera previamente
ALTER TABLE reacciones_tribuna DROP COLUMN IF EXISTS room_id;

-- Añadir stream_id
ALTER TABLE reacciones_tribuna ADD COLUMN IF NOT EXISTS stream_id UUID REFERENCES streams(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_reacciones_tribuna_stream_id ON reacciones_tribuna(stream_id);


-- 4. Habilitar y Configurar Row Level Security (RLS)
ALTER TABLE streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_mensajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reacciones_tribuna ENABLE ROW LEVEL SECURITY;

-- Políticas para 'streams'
DROP POLICY IF EXISTS "Streams públicos para lectura" ON streams;
DROP POLICY IF EXISTS "Creadores pueden insertar streams" ON streams;
DROP POLICY IF EXISTS "Creadores pueden actualizar sus streams" ON streams;

CREATE POLICY "Streams públicos para lectura" ON streams
    FOR SELECT USING (true);

CREATE POLICY "Creadores pueden insertar streams" ON streams
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Creadores pueden actualizar sus streams" ON streams
    FOR UPDATE USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

-- Políticas para 'chat_mensajes'
DROP POLICY IF EXISTS "Mensajes públicos para lectura" ON chat_mensajes;
DROP POLICY IF EXISTS "Cualquiera puede insertar mensajes" ON chat_mensajes;
DROP POLICY IF EXISTS "Moderadores pueden borrar mensajes" ON chat_mensajes;
DROP POLICY IF EXISTS "Mensajes públicos para lectura por stream" ON chat_mensajes;
DROP POLICY IF EXISTS "Cualquiera puede insertar mensajes por stream" ON chat_mensajes;
DROP POLICY IF EXISTS "Moderadores pueden borrar mensajes por stream" ON chat_mensajes;

CREATE POLICY "Mensajes públicos para lectura por stream" ON chat_mensajes
    FOR SELECT USING (stream_id IS NOT NULL);

CREATE POLICY "Cualquiera puede insertar mensajes por stream" ON chat_mensajes
    FOR INSERT WITH CHECK (stream_id IS NOT NULL);

CREATE POLICY "Moderadores pueden borrar mensajes por stream" ON chat_mensajes
    FOR UPDATE USING (true);

-- Políticas para 'reacciones_tribuna'
DROP POLICY IF EXISTS "Reacciones públicas para lectura por stream" ON reacciones_tribuna;
DROP POLICY IF EXISTS "Cualquiera puede insertar reacciones por stream" ON reacciones_tribuna;

CREATE POLICY "Reacciones públicas para lectura por stream" ON reacciones_tribuna
    FOR SELECT USING (stream_id IS NOT NULL);

CREATE POLICY "Cualquiera puede insertar reacciones por stream" ON reacciones_tribuna
    FOR INSERT WITH CHECK (stream_id IS NOT NULL);
