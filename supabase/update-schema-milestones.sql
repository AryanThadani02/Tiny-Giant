-- Create milestones table
CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update steps table to reference milestones instead of goals directly
ALTER TABLE steps ADD COLUMN IF NOT EXISTS milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE;

-- Create indexes
CREATE INDEX IF NOT EXISTS milestones_goal_id_idx ON milestones(goal_id);
CREATE INDEX IF NOT EXISTS steps_milestone_id_idx ON steps(milestone_id);

-- Make sure RLS is disabled for the new table
ALTER TABLE milestones DISABLE ROW LEVEL SECURITY;

-- Grant all privileges to the anon role and service_role
GRANT ALL PRIVILEGES ON TABLE milestones TO anon;
GRANT ALL PRIVILEGES ON TABLE milestones TO service_role;

