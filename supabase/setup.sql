-- Drop existing tables if they exist
DROP TABLE IF EXISTS steps;
DROP TABLE IF EXISTS goals;

-- Create goals table without user_id
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  purpose TEXT,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create steps table
CREATE TABLE steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  time_estimate INTEGER DEFAULT 30,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX steps_goal_id_idx ON steps(goal_id);

-- Make sure RLS is disabled for both tables
ALTER TABLE goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE steps DISABLE ROW LEVEL SECURITY;

-- Grant all privileges to the anon role and service_role
GRANT ALL PRIVILEGES ON TABLE goals TO anon;
GRANT ALL PRIVILEGES ON TABLE steps TO anon;
GRANT ALL PRIVILEGES ON TABLE goals TO service_role;
GRANT ALL PRIVILEGES ON TABLE steps TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Grant usage on the schema
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO service_role;

-- If there are any policies, drop them
DROP POLICY IF EXISTS "Enable read access for all users" ON goals;
DROP POLICY IF EXISTS "Enable insert access for all users" ON goals;
DROP POLICY IF EXISTS "Enable update access for all users" ON goals;
DROP POLICY IF EXISTS "Enable delete access for all users" ON goals;
DROP POLICY IF EXISTS "Enable read access for all users" ON steps;
DROP POLICY IF EXISTS "Enable insert access for all users" ON steps;
DROP POLICY IF EXISTS "Enable update access for all users" ON steps;
DROP POLICY IF EXISTS "Enable delete access for all users" ON steps;

-- Create a stored procedure to insert a goal
CREATE OR REPLACE FUNCTION insert_goal(
  p_title TEXT,
  p_purpose TEXT,
  p_due_date TIMESTAMP WITH TIME ZONE
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO goals (title, purpose, due_date)
  VALUES (p_title, p_purpose, p_due_date)
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a stored procedure to insert a step
CREATE OR REPLACE FUNCTION insert_step(
  p_goal_id UUID,
  p_text TEXT,
  p_time_estimate INTEGER,
  p_notes TEXT
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO steps (goal_id, text, time_estimate, notes)
  VALUES (p_goal_id, p_text, p_time_estimate, p_notes)
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION insert_goal TO anon;
GRANT EXECUTE ON FUNCTION insert_step TO anon;
GRANT EXECUTE ON FUNCTION insert_goal TO service_role;
GRANT EXECUTE ON FUNCTION insert_step TO service_role;

