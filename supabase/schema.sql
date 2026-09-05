-- ==============================================================================
-- SevaSetu Production Database Schema
-- PostGIS Spatial Clustering, Atomic Cascading Triggers & Row-Level Security (RLS)
-- ==============================================================================

-- 1. Enable PostGIS & UUID extensions
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Custom Enum Types
CREATE TYPE user_role AS ENUM ('CITIZEN', 'FIELD_OFFICER', 'DEPT_ADMIN', 'SYSTEM_ADMIN');
CREATE TYPE complaint_status AS ENUM (
  'Pending_Verification',
  'Linked_To_Master',
  'Assigned',
  'In_Progress',
  'Resolved',
  'Rejected'
);
CREATE TYPE severity_level AS ENUM ('Low', 'Medium', 'High', 'Critical');

-- 3. Profiles Table (Citizens & Officers)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(150),
  role user_role DEFAULT 'CITIZEN',
  department VARCHAR(100),
  state VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  house_no VARCHAR(100),
  building VARCHAR(100),
  street VARCHAR(200),
  location GEOMETRY(Point, 4326),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Master Complaints (Clusters) Table
CREATE TABLE IF NOT EXISTS master_complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  master_ticket_number VARCHAR(50) UNIQUE NOT NULL,
  department VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  priority_score INTEGER CHECK (priority_score BETWEEN 1 AND 10) NOT NULL,
  severity_level severity_level NOT NULL,
  status complaint_status DEFAULT 'Pending_Verification' NOT NULL,
  address_text TEXT NOT NULL,
  location GEOMETRY(Point, 4326) NOT NULL,
  complaint_count INTEGER DEFAULT 1 NOT NULL,
  ai_summary TEXT NOT NULL,
  recommended_action TEXT,
  verified_by UUID REFERENCES profiles(id),
  is_ai_suggested_cluster BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Individual Grievances Table
CREATE TABLE IF NOT EXISTS grievances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  citizen_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  citizen_name VARCHAR(150) NOT NULL,
  citizen_phone VARCHAR(20) NOT NULL,
  master_complaint_id UUID REFERENCES master_complaints(id) ON DELETE SET NULL,
  issue_title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  audio_url TEXT,
  raw_transcript TEXT,
  detected_language VARCHAR(50) DEFAULT 'en',
  latitude NUMERIC(9, 6) NOT NULL,
  longitude NUMERIC(9, 6) NOT NULL,
  address_text TEXT NOT NULL,
  state VARCHAR(100),
  city VARCHAR(100),
  pincode VARCHAR(10),
  house_no VARCHAR(100),
  street VARCHAR(200),
  location GEOMETRY(Point, 4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)) STORED,
  priority_score INTEGER CHECK (priority_score BETWEEN 1 AND 10) NOT NULL,
  severity_level severity_level NOT NULL,
  severity_reasoning TEXT,
  department VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  similarity_score NUMERIC(5, 2),
  status complaint_status DEFAULT 'Pending_Verification' NOT NULL,
  is_valid_grievance BOOLEAN DEFAULT TRUE,
  rejection_reason TEXT,
  summary TEXT,
  recommended_action TEXT,
  officer_comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Audit & Status Logs Table
CREATE TABLE IF NOT EXISTS status_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  master_complaint_id UUID REFERENCES master_complaints(id) ON DELETE CASCADE,
  grievance_id UUID REFERENCES grievances(id) ON DELETE CASCADE,
  officer_id UUID REFERENCES profiles(id),
  officer_name VARCHAR(150) NOT NULL,
  old_status complaint_status,
  new_status complaint_status NOT NULL,
  comment TEXT,
  proof_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- Spatial & Performance Indexing (10,000+ Concurrent Scale)
-- ==============================================================================

-- GIST Spatial Indices for sub-millisecond 50m radius lookups
CREATE INDEX IF NOT EXISTS idx_grievances_spatial ON grievances USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_master_complaints_spatial ON master_complaints USING GIST(location);

-- B-Tree Indices for High-Frequency Filters
CREATE INDEX IF NOT EXISTS idx_grievances_dept_status ON grievances(department, status);
CREATE INDEX IF NOT EXISTS idx_grievances_state_city ON grievances(state, city);
CREATE INDEX IF NOT EXISTS idx_grievances_pincode ON grievances(pincode);
CREATE INDEX IF NOT EXISTS idx_grievances_master_id ON grievances(master_complaint_id);
CREATE INDEX IF NOT EXISTS idx_grievances_citizen_phone ON grievances(citizen_phone);

-- ==============================================================================
-- Spatial Proximity Function (<= 50m, <= 48h)
-- ==============================================================================
CREATE OR REPLACE FUNCTION find_nearby_master_complaints(
  p_lat DOUBLE PRECISION,
  p_lng DOUBLE PRECISION,
  p_category VARCHAR,
  p_radius_meters DOUBLE PRECISION DEFAULT 50.0,
  p_window_hours INTEGER DEFAULT 48
)
RETURNS TABLE (
  master_id UUID,
  master_ticket VARCHAR,
  category VARCHAR,
  department VARCHAR,
  distance_meters DOUBLE PRECISION,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    m.id AS master_id,
    m.master_ticket_number AS master_ticket,
    m.category,
    m.department,
    ST_Distance(
      m.location::geography, 
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    ) AS distance_meters,
    m.created_at
  FROM master_complaints m
  WHERE 
    m.status NOT IN ('Resolved', 'Rejected')
    AND m.category = p_category
    AND m.created_at >= NOW() - (p_window_hours || ' hours')::INTERVAL
    AND ST_DWithin(
      m.location::geography, 
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, 
      p_radius_meters
    )
  ORDER BY distance_meters ASC;
$$;

-- ==============================================================================
-- Database Trigger: Atomic Master-to-Child Cascading Status Synchronization
-- ==============================================================================
CREATE OR REPLACE FUNCTION sync_master_status_to_children()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- When master complaint status changes, atomically cascade to all linked grievances
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    UPDATE grievances
    SET 
      status = NEW.status,
      updated_at = NOW()
    WHERE master_complaint_id = NEW.id;

    -- Append cascading audit log
    INSERT INTO status_logs (
      master_complaint_id,
      officer_name,
      old_status,
      new_status,
      comment
    ) VALUES (
      NEW.id,
      'System Trigger (Atomic Sync)',
      OLD.status,
      NEW.status,
      'Cascaded status to all linked grievances automatically.'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_master_status ON master_complaints;
CREATE TRIGGER trg_sync_master_status
AFTER UPDATE OF status ON master_complaints
FOR EACH ROW
EXECUTE FUNCTION sync_master_status_to_children();

-- ==============================================================================
-- Row-Level Security (RLS) Policies
-- ==============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE grievances ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE status_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Citizens can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Citizens can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. Grievances Policies
CREATE POLICY "Citizens can view own submitted grievances"
  ON grievances FOR SELECT
  USING (
    citizen_id = auth.uid() 
    OR citizen_phone = (SELECT phone FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Citizens can insert grievances"
  ON grievances FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Department officers can view complaints in their department"
  ON grievances FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (
        profiles.role IN ('DEPT_ADMIN', 'SYSTEM_ADMIN') 
        OR (profiles.role = 'FIELD_OFFICER' AND profiles.department = grievances.department)
      )
    )
  );

CREATE POLICY "Department officers can update grievances in their department"
  ON grievances FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (
        profiles.role IN ('DEPT_ADMIN', 'SYSTEM_ADMIN') 
        OR (profiles.role = 'FIELD_OFFICER' AND profiles.department = grievances.department)
      )
    )
  );

-- 3. Master Complaints Policies
CREATE POLICY "Anyone authenticated can read master complaints"
  ON master_complaints FOR SELECT
  USING (true);

CREATE POLICY "Officers can update master complaints in their department"
  ON master_complaints FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND (
        profiles.role IN ('DEPT_ADMIN', 'SYSTEM_ADMIN') 
        OR (profiles.role = 'FIELD_OFFICER' AND profiles.department = master_complaints.department)
      )
    )
  );
