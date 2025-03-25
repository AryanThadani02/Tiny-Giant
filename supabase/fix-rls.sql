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

