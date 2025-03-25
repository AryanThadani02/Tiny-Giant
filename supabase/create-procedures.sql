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

