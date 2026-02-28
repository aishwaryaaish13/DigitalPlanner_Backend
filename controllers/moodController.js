import supabase from '../config/supabase.js';

const logMood = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { mood } = req.body;

    // Validate required fields
    if (!mood) {
      return res.status(400).json({ error: 'Mood is required' });
    }

    // Insert mood log into Supabase
    const { data: moodLog, error } = await supabase
      .from('mood_logs')
      .insert([{
        user_id: userId,
        mood,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to log mood' });
    }

    return res.status(201).json({ message: 'Mood logged successfully', moodLog });
  } catch (error) {
    console.error('Log mood error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getMoodLogs = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Fetch all mood logs for the logged-in user
    const { data: moodLogs, error } = await supabase
      .from('mood_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch mood logs' });
    }

    return res.status(200).json({ moodLogs, count: moodLogs.length });
  } catch (error) {
    console.error('Get mood logs error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteMood = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    // Verify the mood log exists and belongs to the user
    const { data: existingMood, error: fetchError } = await supabase
      .from('mood_logs')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!existingMood || fetchError) {
      return res.status(403).json({ error: 'Mood log not found or unauthorized' });
    }

    // Delete the mood log
    const { error: deleteError } = await supabase
      .from('mood_logs')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Database error:', deleteError);
      return res.status(500).json({ error: 'Failed to delete mood log' });
    }

    return res.status(200).json({ message: 'Mood log deleted successfully' });
  } catch (error) {
    console.error('Delete mood error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export { logMood, getMoodLogs, deleteMood };
