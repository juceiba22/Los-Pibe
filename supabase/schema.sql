-- 1. Usuarios (Se maneja automáticamente a través de Supabase Auth, pero extendemos su perfil)
CREATE TABLE perfiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  rol TEXT DEFAULT 'viewer' CHECK (rol IN ('viewer', 'moderator', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Estado del Stream (Como solo hay UNO, tendrá siempre id = 1)
CREATE TABLE stream_estado (
  id INT PRIMARY KEY DEFAULT 1,
  titulo TEXT,
  is_live BOOLEAN DEFAULT false,
  mux_playback_id TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar estado inicial
INSERT INTO stream_estado (id, titulo, is_live, mux_playback_id) VALUES (1, 'Transmisión Privada', false, '') ON CONFLICT (id) DO NOTHING;

-- 3. Mensajes del Chat
CREATE TABLE chat_mensajes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES perfiles(id) NOT NULL,
  mensaje TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS)
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stream_estado ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_mensajes ENABLE ROW LEVEL SECURITY;

-- Políticas para 'perfiles'
CREATE POLICY "Perfiles públicos para lectura" ON perfiles FOR SELECT USING (true);
CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON perfiles FOR UPDATE USING (auth.uid() = id);

-- Políticas para 'stream_estado'
CREATE POLICY "Estado del stream público para lectura" ON stream_estado FOR SELECT USING (true);
-- Deberíamos asegurar que solo admins actualicen el estado, pero para el MVP dejaremos abierto o con un check simple.

-- Políticas para 'chat_mensajes'
CREATE POLICY "Mensajes públicos para lectura" ON chat_mensajes FOR SELECT USING (is_deleted = false OR (SELECT rol FROM perfiles WHERE id = auth.uid()) IN ('admin', 'moderator'));
CREATE POLICY "Usuarios autenticados pueden insertar mensajes" ON chat_mensajes FOR INSERT WITH CHECK (auth.uid() = user_id);
-- Permitir actualizar is_deleted solo a admin/mod
CREATE POLICY "Moderadores pueden borrar mensajes" ON chat_mensajes FOR UPDATE USING ((SELECT rol FROM perfiles WHERE id = auth.uid()) IN ('admin', 'moderator')) WITH CHECK (true);
