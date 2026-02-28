import supabase from '../config/supabase.js';

// GET /api/productivity - Get user's productivity data
const getProductivity = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const { data: productivity, error } = await supabase
      .from('user_productivity')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - productivity record doesn't exist
        return res.status(404).json({ 
          error: 'Productivity record not found',
          message: 'Please initialize productivity tracking first'
        });
      }
      console.error('Get productivity error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch productivity data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    return res.status(200).json(productivity);
  } catch (error) {
    console.error('Get productivity error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// POST /api/productivity/initialize - Create initial productivity record
const initializeProductivity = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    // Check if record already exists
    const { data: existing } = await supabase
      .from('user_productivity')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      return res.status(200).json({ 
        message: 'Productivity record already exists',
        id: existing.id
      });
    }

    // Create new productivity record with default values
    const { data: productivity, error } = await supabase
      .from('user_productivity')
      .insert([{
        user_id: userId,
        completed_days: [],
        productivity_data: {},
        tasks_completed: 0,
        goals_completed: 0,
        total_goals: 0,
        focus_sessions: 0,
        unlocked_badges: []
      }])
      .select()
      .single();

    if (error) {
      console.error('Initialize productivity error:', error);
      return res.status(500).json({ 
        error: 'Failed to initialize productivity tracking',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    return res.status(201).json({ 
      message: 'Productivity tracking initialized successfully',
      productivity
    });
  } catch (error) {
    console.error('Initialize productivity error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// POST /api/productivity/task-complete - Mark task as completed for a date
const completeTask = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    // Fetch current productivity data
    const { data: productivity, error: fetchError } = await supabase
      .from('user_productivity')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError || !productivity) {
      return res.status(404).json({ 
        error: 'Productivity record not found',
        message: 'Please initialize productivity tracking first'
      });
    }

    // Parse JSON fields
    const completedDays = productivity.completed_days || [];
    const productivityData = productivity.productivity_data || {};

    // Add date to completed_days if not exists
    if (!completedDays.includes(date)) {
      completedDays.push(date);
    }

    // Increment count for this date
    productivityData[date] = (productivityData[date] || 0) + 1;

    // Update the record
    const { data: updated, error: updateError } = await supabase
      .from('user_productivity')
      .update({
        completed_days: completedDays,
        productivity_data: productivityData,
        tasks_completed: productivity.tasks_completed + 1
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Complete task error:', updateError);
      return res.status(500).json({ 
        error: 'Failed to update productivity data',
        details: process.env.NODE_ENV === 'development' ? updateError.message : undefined
      });
    }

    return res.status(200).json({ 
      message: 'Task completion recorded successfully',
      productivity: updated
    });
  } catch (error) {
    console.error('Complete task error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// POST /api/productivity/task-uncomplete - Mark task as uncompleted for a date
const uncompleteTask = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { date } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    // Fetch current productivity data
    const { data: productivity, error: fetchError } = await supabase
      .from('user_productivity')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError || !productivity) {
      return res.status(404).json({ 
        error: 'Productivity record not found',
        message: 'Please initialize productivity tracking first'
      });
    }

    // Parse JSON fields
    const productivityData = productivity.productivity_data || {};

    // Decrement count for this date (minimum 0)
    if (productivityData[date]) {
      productivityData[date] = Math.max(0, productivityData[date] - 1);
      
      // Remove date entry if count reaches 0
      if (productivityData[date] === 0) {
        delete productivityData[date];
      }
    }

    // Update the record
    const { data: updated, error: updateError } = await supabase
      .from('user_productivity')
      .update({
        productivity_data: productivityData,
        tasks_completed: Math.max(0, productivity.tasks_completed - 1)
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Uncomplete task error:', updateError);
      return res.status(500).json({ 
        error: 'Failed to update productivity data',
        details: process.env.NODE_ENV === 'development' ? updateError.message : undefined
      });
    }

    return res.status(200).json({ 
      message: 'Task uncompletion recorded successfully',
      productivity: updated
    });
  } catch (error) {
    console.error('Uncomplete task error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// POST /api/productivity/goal-complete - Increment goals completed
const completeGoal = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    // Fetch current productivity data
    const { data: productivity, error: fetchError } = await supabase
      .from('user_productivity')
      .select('goals_completed')
      .eq('user_id', userId)
      .single();

    if (fetchError || !productivity) {
      return res.status(404).json({ 
        error: 'Productivity record not found',
        message: 'Please initialize productivity tracking first'
      });
    }

    // Update the record
    const { data: updated, error: updateError } = await supabase
      .from('user_productivity')
      .update({
        goals_completed: productivity.goals_completed + 1
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Complete goal error:', updateError);
      return res.status(500).json({ 
        error: 'Failed to update productivity data',
        details: process.env.NODE_ENV === 'development' ? updateError.message : undefined
      });
    }

    return res.status(200).json({ 
      message: 'Goal completion recorded successfully',
      productivity: updated
    });
  } catch (error) {
    console.error('Complete goal error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// PUT /api/productivity/total-goals - Update total goals count
const updateTotalGoals = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { count } = req.body;

    if (count === undefined || count === null) {
      return res.status(400).json({ error: 'Count is required' });
    }

    if (typeof count !== 'number' || count < 0) {
      return res.status(400).json({ error: 'Count must be a non-negative number' });
    }

    // Update the record
    const { data: updated, error: updateError } = await supabase
      .from('user_productivity')
      .update({
        total_goals: count
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return res.status(404).json({ 
          error: 'Productivity record not found',
          message: 'Please initialize productivity tracking first'
        });
      }
      console.error('Update total goals error:', updateError);
      return res.status(500).json({ 
        error: 'Failed to update total goals',
        details: process.env.NODE_ENV === 'development' ? updateError.message : undefined
      });
    }

    return res.status(200).json({ 
      message: 'Total goals updated successfully',
      productivity: updated
    });
  } catch (error) {
    console.error('Update total goals error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// POST /api/productivity/focus-complete - Increment focus sessions
const completeFocusSession = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    // Fetch current productivity data
    const { data: productivity, error: fetchError } = await supabase
      .from('user_productivity')
      .select('focus_sessions')
      .eq('user_id', userId)
      .single();

    if (fetchError || !productivity) {
      return res.status(404).json({ 
        error: 'Productivity record not found',
        message: 'Please initialize productivity tracking first'
      });
    }

    // Update the record
    const { data: updated, error: updateError } = await supabase
      .from('user_productivity')
      .update({
        focus_sessions: productivity.focus_sessions + 1
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Complete focus session error:', updateError);
      return res.status(500).json({ 
        error: 'Failed to update productivity data',
        details: process.env.NODE_ENV === 'development' ? updateError.message : undefined
      });
    }

    return res.status(200).json({ 
      message: 'Focus session recorded successfully',
      productivity: updated
    });
  } catch (error) {
    console.error('Complete focus session error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// POST /api/productivity/unlock-badge - Add badge to unlocked badges
const unlockBadge = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { badgeId } = req.body;

    if (!badgeId) {
      return res.status(400).json({ error: 'Badge ID is required' });
    }

    // Fetch current productivity data
    const { data: productivity, error: fetchError } = await supabase
      .from('user_productivity')
      .select('unlocked_badges')
      .eq('user_id', userId)
      .single();

    if (fetchError || !productivity) {
      return res.status(404).json({ 
        error: 'Productivity record not found',
        message: 'Please initialize productivity tracking first'
      });
    }

    // Parse unlocked badges
    const unlockedBadges = productivity.unlocked_badges || [];

    // Add badge if not already unlocked
    if (!unlockedBadges.includes(badgeId)) {
      unlockedBadges.push(badgeId);

      // Update the record
      const { data: updated, error: updateError } = await supabase
        .from('user_productivity')
        .update({
          unlocked_badges: unlockedBadges
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) {
        console.error('Unlock badge error:', updateError);
        return res.status(500).json({ 
          error: 'Failed to unlock badge',
          details: process.env.NODE_ENV === 'development' ? updateError.message : undefined
        });
      }

      return res.status(200).json({ 
        message: 'Badge unlocked successfully',
        productivity: updated
      });
    }

    // Badge already unlocked
    return res.status(200).json({ 
      message: 'Badge already unlocked',
      productivity
    });
  } catch (error) {
    console.error('Unlock badge error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export {
  getProductivity,
  initializeProductivity,
  completeTask,
  uncompleteTask,
  completeGoal,
  updateTotalGoals,
  completeFocusSession,
  unlockBadge
};
