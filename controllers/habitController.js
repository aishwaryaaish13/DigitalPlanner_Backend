import supabase from '../config/supabase.js';

const createHabit = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { habit_name, frequency } = req.body;

    // Validate required fields
    if (!habit_name) {
      return res.status(400).json({ error: 'Habit name is required' });
    }

    if (!frequency) {
      return res.status(400).json({ error: 'Frequency is required' });
    }

    // Insert habit into Supabase with default values
    const { data: habit, error } = await supabase
      .from('habits')
      .insert([{
        user_id: userId,
        habit_name,
        frequency,
        streak: 0,
        completed_today: false,
        last_completed_date: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to create habit', details: error.message });
    }

    return res.status(201).json({ message: 'Habit created successfully', habit });
  } catch (error) {
    console.error('Create habit error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

const getHabits = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const today = new Date().toISOString().split('T')[0];

    // Fetch all habits for the logged-in user
    const { data: habits, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch habits', details: error.message });
    }

    // Auto-reset completed_today and update streak if needed
    const processedHabits = await Promise.all(habits.map(async (habit) => {
      const lastCompleted = habit.last_completed_date;
      const needsReset = lastCompleted !== today && habit.completed_today;

      if (needsReset) {
        // Check if streak should be broken
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let newStreak = habit.streak;
        
        // Break streak if last completion wasn't yesterday
        if (lastCompleted !== yesterdayStr) {
          newStreak = 0;
        }

        // Update the habit in database
        const { data: updated, error: updateError } = await supabase
          .from('habits')
          .update({
            completed_today: false,
            streak: newStreak,
            updated_at: new Date().toISOString()
          })
          .eq('id', habit.id)
          .select()
          .single();

        if (!updateError && updated) {
          return updated;
        }
      }

      return {
        ...habit,
        completed_today: lastCompleted === today ? habit.completed_today : false
      };
    }));

    return res.status(200).json({ habits: processedHabits, count: processedHabits.length });
  } catch (error) {
    console.error('Get habits error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

const updateHabit = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { id } = req.params;
    const { habit_name, frequency, completed_today, streak } = req.body;

    // Verify the habit exists and belongs to the user
    const { data: existingHabit, error: fetchError } = await supabase
      .from('habits')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!existingHabit || fetchError) {
      return res.status(403).json({ error: 'Habit not found or unauthorized' });
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Build update data with all provided fields
    const updateData = { updated_at: new Date().toISOString() };
    
    if (habit_name !== undefined) updateData.habit_name = habit_name;
    if (frequency !== undefined) updateData.frequency = frequency;
    
    if (completed_today !== undefined) {
      updateData.completed_today = completed_today;
      
      if (completed_today) {
        // Marking as complete
        updateData.last_completed_date = today;
        
        // Calculate streak
        const lastCompleted = existingHabit.last_completed_date;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (!lastCompleted || lastCompleted === today) {
          // First time or same day - keep current streak and add 1
          updateData.streak = (existingHabit.streak || 0) + 1;
        } else if (lastCompleted === yesterdayStr) {
          // Completed yesterday - continue streak
          updateData.streak = (existingHabit.streak || 0) + 1;
        } else {
          // Streak broken - start new streak
          updateData.streak = 1;
        }
      } else {
        // Marking as incomplete - reset streak if it was completed today
        if (existingHabit.last_completed_date === today) {
          updateData.streak = Math.max(0, (existingHabit.streak || 0) - 1);
        }
      }
    }
    
    if (streak !== undefined) updateData.streak = streak;

    // Update the habit
    const { data: updatedHabit, error: updateError } = await supabase
      .from('habits')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Database error:', updateError);
      return res.status(500).json({ error: 'Failed to update habit', details: updateError.message });
    }

    return res.status(200).json({ message: 'Habit updated successfully', habit: updatedHabit });
  } catch (error) {
    console.error('Update habit error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

const deleteHabit = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { id } = req.params;

    // Verify the habit exists and belongs to the user
    const { data: existingHabit, error: fetchError } = await supabase
      .from('habits')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!existingHabit || fetchError) {
      return res.status(403).json({ error: 'Habit not found or unauthorized' });
    }

    // Delete the habit
    const { error: deleteError } = await supabase
      .from('habits')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Database error:', deleteError);
      return res.status(500).json({ error: 'Failed to delete habit', details: deleteError.message });
    }

    return res.status(200).json({ message: 'Habit deleted successfully' });
  } catch (error) {
    console.error('Delete habit error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};

export { createHabit, getHabits, updateHabit, deleteHabit };
