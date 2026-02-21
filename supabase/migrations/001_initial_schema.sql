-- YoutubeMaker Studio - Initial Schema

CREATE TYPE project_status AS ENUM (
  'idea', 'research', 'script', 'record', 'edit', 'review', 'publish'
);

CREATE TYPE asset_type AS ENUM (
  'image', 'video', 'audio', 'thumbnail', 'diagram'
);

CREATE TYPE recording_type AS ENUM (
  'webcam', 'screen', 'audio'
);

CREATE TYPE idea_status AS ENUM (
  'raw', 'researching', 'promoted'
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  status project_status NOT NULL DEFAULT 'idea',
  description TEXT DEFAULT '',
  thumbnail_url TEXT,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  content_json JSONB,
  plain_text TEXT DEFAULT '',
  version INTEGER NOT NULL DEFAULT 1,
  word_count INTEGER DEFAULT 0,
  est_duration_seconds INTEGER DEFAULT 0,
  is_current BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE asset_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES asset_folders(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  folder_id UUID REFERENCES asset_folders(id) ON DELETE SET NULL,
  type asset_type NOT NULL DEFAULT 'image',
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  supabase_url TEXT,
  file_size BIGINT DEFAULT 0,
  metadata_json JSONB,
  tags TEXT[] DEFAULT '{}',
  ai_prompt TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type recording_type NOT NULL DEFAULT 'webcam',
  storage_path TEXT NOT NULL,
  supabase_url TEXT,
  duration_seconds INTEGER DEFAULT 0,
  take_number INTEGER DEFAULT 1,
  is_starred BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE thumbnails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  storage_path TEXT,
  supabase_url TEXT,
  is_primary BOOLEAN DEFAULT false,
  canvas_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE video_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL UNIQUE REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT DEFAULT '',
  description TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  category TEXT DEFAULT 'Education',
  chapters_json JSONB DEFAULT '[]',
  end_screen_json JSONB,
  cards_json JSONB,
  publish_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  notes TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  rating INTEGER DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  status idea_status NOT NULL DEFAULT 'raw',
  promoted_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_scripts_project ON scripts(project_id);
CREATE INDEX idx_assets_project ON assets(project_id);
CREATE INDEX idx_assets_type ON assets(type);
CREATE INDEX idx_assets_folder ON assets(folder_id);
CREATE INDEX idx_recordings_project ON recordings(project_id);
CREATE INDEX idx_thumbnails_project ON thumbnails(project_id);
CREATE INDEX idx_ideas_status ON ideas(status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER video_metadata_updated_at
  BEFORE UPDATE ON video_metadata
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Storage buckets (created via Supabase Storage API, not SQL)
-- Run these in the Supabase Dashboard SQL Editor or via the JS client:
--
-- INSERT INTO storage.buckets (id, name, public) VALUES ('recordings', 'recordings', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('assets', 'assets', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('thumbnails', 'thumbnails', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('exports', 'exports', true);
--
-- Enable public access policy for each bucket:
-- CREATE POLICY "Public read" ON storage.objects FOR SELECT USING (bucket_id IN ('recordings','assets','thumbnails','exports'));
-- CREATE POLICY "Auth upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('recordings','assets','thumbnails','exports'));
-- CREATE POLICY "Auth delete" ON storage.objects FOR DELETE USING (bucket_id IN ('recordings','assets','thumbnails','exports'));
