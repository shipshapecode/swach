-- ============================================
-- Swach Supabase Database Schema
-- ============================================

-- Enable UUID extension for generating IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Palettes Table
-- ============================================
CREATE TABLE IF NOT EXISTS palettes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT,
  is_color_history BOOLEAN DEFAULT FALSE,
  is_favorite BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  selected_color_index INTEGER DEFAULT 0,
  sort_index INTEGER DEFAULT 0,
  color_order JSONB DEFAULT '[]'::jsonb,

  -- Constraints
  CONSTRAINT palettes_user_not_null CHECK (user_id IS NOT NULL),
  CONSTRAINT palettes_single_color_history_per_user UNIQUE (user_id, is_color_history) 
    DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT palettes_name_length CHECK (char_length(name) <= 255)
);

-- ============================================
-- Colors Table  
-- ============================================
CREATE TABLE IF NOT EXISTS colors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  palette_id UUID REFERENCES palettes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  name TEXT,
  r INTEGER NOT NULL CHECK (r >= 0 AND r <= 255),
  g INTEGER NOT NULL CHECK (g >= 0 AND g <= 255),
  b INTEGER NOT NULL CHECK (b >= 0 AND b <= 255),
  a REAL DEFAULT 1.0 CHECK (a >= 0.0 AND a <= 1.0),

  -- Constraints
  CONSTRAINT colors_user_not_null CHECK (user_id IS NOT NULL),
  CONSTRAINT colors_palette_not_null CHECK (palette_id IS NOT NULL),
  CONSTRAINT colors_name_length CHECK (char_length(name) <= 255)
);

-- ============================================
-- Indexes for Performance
-- ============================================

-- Palettes indexes
CREATE INDEX IF NOT EXISTS idx_palettes_user_id ON palettes(user_id);
CREATE INDEX IF NOT EXISTS idx_palettes_created_at ON palettes(created_at);
CREATE INDEX IF NOT EXISTS idx_palettes_is_favorite ON palettes(is_favorite) WHERE is_favorite = TRUE;
CREATE INDEX IF NOT EXISTS idx_palettes_is_color_history ON palettes(is_color_history) WHERE is_color_history = TRUE;

-- Colors indexes  
CREATE INDEX IF NOT EXISTS idx_colors_user_id ON colors(user_id);
CREATE INDEX IF NOT EXISTS idx_colors_palette_id ON colors(palette_id);
CREATE INDEX IF NOT EXISTS idx_colors_created_at ON colors(created_at);

-- GIN indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_palettes_color_order ON palettes USING GIN(color_order);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE palettes ENABLE ROW LEVEL SECURITY;
ALTER TABLE colors ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own palettes
CREATE POLICY "Users can view own palettes" ON palettes
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own palettes
CREATE POLICY "Users can insert own palettes" ON palettes  
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own palettes
CREATE POLICY "Users can update own palettes" ON palettes
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own palettes
CREATE POLICY "Users can delete own palettes" ON palettes
  FOR DELETE USING (auth.uid() = user_id);

-- Policy: Users can view their own colors
CREATE POLICY "Users can view own colors" ON colors
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own colors
CREATE POLICY "Users can insert own colors" ON colors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own colors  
CREATE POLICY "Users can update own colors" ON colors
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own colors
CREATE POLICY "Users can delete own colors" ON colors
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- Functions for Data Management
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
CREATE TRIGGER update_palettes_updated_at
  BEFORE UPDATE ON palettes
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_colors_updated_at
  BEFORE UPDATE ON colors  
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================
-- Sample Data for Testing
-- ============================================

-- Function to create sample color history palette for new users
CREATE OR REPLACE FUNCTION create_sample_color_history_for_user(user_uuid UUID)
RETURNS UUID AS $$
DECLARE
  palette_uuid UUID;
  color_uuid1 UUID;
  color_uuid2 UUID;
  color_uuid3 UUID;
BEGIN
  -- Create color history palette
  INSERT INTO palettes (user_id, name, is_color_history, selected_color_index, color_order)
  VALUES (
    user_uuid,
    'Color History',
    TRUE,
    0,
    '[]'::jsonb
  )
  RETURNING id INTO palette_uuid;
  
  -- Create sample colors
  INSERT INTO colors (user_id, palette_id, name, r, g, b, a)
  VALUES 
    (user_uuid, palette_uuid, 'Pure Black', 0, 0, 0, 1.0),
    (user_uuid, palette_uuid, 'Pure White', 255, 255, 255, 1.0),
    (user_uuid, palette_uuid, 'Pure Red', 255, 0, 0, 1.0)
  RETURNING id INTO color_uuid1, color_uuid2, color_uuid3;
  
  -- Update color_order with the color references
  UPDATE palettes 
  SET color_order = jsonb_build_array(
    jsonb_build_object('type', 'color', 'id', color_uuid1),
    jsonb_build_object('type', 'color', 'id', color_uuid2), 
    jsonb_build_object('type', 'color', 'id', color_uuid3)
  )
  WHERE id = palette_uuid;
  
  RETURN palette_uuid;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Views for Common Queries
-- ============================================

-- View: Palettes with colors preloaded
CREATE OR REPLACE VIEW palettes_with_colors AS
SELECT 
  p.*,
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'type', 'color',
        'id', c.id,
        'attributes', jsonb_build_object(
          'name', c.name,
          'r', c.r,
          'g', c.g, 
          'b', c.b,
          'a', c.a,
          'created_at', c.created_at
        )
      )
    ) FILTER (WHERE c.id IS NOT NULL),
    '[]'::jsonb
  ) as colors
FROM palettes p
LEFT JOIN colors c ON c.palette_id = p.id
WHERE p.user_id = auth.uid()
GROUP BY p.id, p.user_id, p.name, p.is_color_history, p.is_favorite, p.is_locked, 
         p.selected_color_index, p.sort_index, p.color_order, p.created_at, p.updated_at;

-- ============================================
-- Migration Helper Functions
-- ============================================

-- Function to migrate from exported Orbit.js data
CREATE OR REPLACE FUNCTION migrate_orbit_palette_data(
  user_uuid UUID,
  palette_data JSONB,
  color_data JSONB
)
RETURNS UUID AS $$
DECLARE
  palette_uuid UUID;
BEGIN
  -- Insert palette
  INSERT INTO palettes (user_id, name, is_color_history, is_favorite, is_locked, selected_color_index, sort_index, color_order)
  VALUES (
    user_uuid,
    palette_data->>'name',
    (palette_data->>'isColorHistory')::BOOLEAN,
    (palette_data->>'isFavorite')::BOOLEAN,
    (palette_data->>'isLocked')::BOOLEAN,
    COALESCE((palette_data->>'selectedColorIndex')::INTEGER, 0),
    COALESCE((palette_data->>'sortIndex')::INTEGER, 0),
    COALESCE(palette_data->>'colorOrder', '[]'::jsonb)
  )
  RETURNING id INTO palette_uuid;
  
  -- Return the new palette UUID for relationships
  RETURN palette_uuid;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION migrate_orbit_color_data(
  user_uuid UUID,
  palette_uuid UUID,
  color_data JSONB
)
RETURNS UUID AS $$
BEGIN
  -- Insert color
  INSERT INTO colors (user_id, palette_id, name, r, g, b, a)
  VALUES (
    user_uuid,
    palette_uuid,
    color_data->>'name',
    (color_data->>'r')::INTEGER,
    (color_data->>'g')::INTEGER,
    (color_data->>'b')::INTEGER,
    COALESCE((color_data->>'a')::REAL, 1.0)
  )
  RETURNING id;
END;
$$ LANGUAGE plpgsql;
