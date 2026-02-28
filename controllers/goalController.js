import supabase from '../config/supabase.js';

const createGoal = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title, target_value, current_value, deadline } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (target_value === undefined) {
      return res.status(400).json({ error: 'Target value is required' });
    }

    // Insert goal into Supabase
    const { data: goal, error } = await supabase
      .from('goals')
      .insert([{
        user_id: userId,
        title,
        target_value,
        current_value: current_value || 0,
        deadline: deadline || null,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to create goal' });
    }

    return res.status(201).json({ message: 'Goal created successfully', goal });
  } catch (error) {
    console.error('Create goal error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getGoals = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Fetch all goals for the logged-in user
    const { data: goals, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch goals' });
    }

    return res.status(200).json({ goals, count: goals.length });
  } catch (error) {
    console.error('Get goals error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const updateGoal = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { title, target_value, current_value, deadline } = req.body;

    // Verify the goal exists and belongs to the user
    const { data: existingGoal, error: fetchError } = await supabase
      .from('goals')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!existingGoal || fetchError) {
      return res.status(403).json({ error: 'Goal not found or unauthorized' });
    }

    // Build update data with only provided fields
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (target_value !== undefined) updateData.target_value = target_value;
    if (current_value !== undefined) updateData.current_value = current_value;
    if (deadline !== undefined) updateData.deadline = deadline;

    // Update the goal
    const { data: updatedGoal, error: updateError } = await supabase
      .from('goals')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Database error:', updateError);
      return res.status(500).json({ error: 'Failed to update goal' });
    }

    return res.status(200).json({ message: 'Goal updated successfully', goal: updatedGoal });
  } catch (error) {
    console.error('Update goal error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteGoal = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    // Verify the goal exists and belongs to the user
    const { data: existingGoal, error: fetchError } = await supabase
      .from('goals')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!existingGoal || fetchError) {
      return res.status(403).json({ error: 'Goal not found or unauthorized' });
    }

    // Delete the goal
    const { error: deleteError } = await supabase
      .from('goals')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Database error:', deleteError);
      return res.status(500).json({ error: 'Failed to delete goal' });
    }

    return res.status(200).json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Delete goal error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export { createGoal, getGoals, updateGoal, deleteGoal };
