import supabase from '../config/supabase.js';

/**
 * CREATE JOURNAL ENTRY
 */
const createJournalEntry = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { content, mood } = req.body;

    console.log('Creating journal entry:', { userId, content, mood });

    if (!content) {
      return res.status(400).json({
        error: 'Content is required'
      });
    }

    const insertData = {
      user_id: userId,
      content,
      mood: mood !== undefined ? mood : null
    };

    console.log('Insert data:', insertData);

    const { data, error } = await supabase
      .from('journal_entries')
      .insert([insertData])
      .select()
      .single();

    if (error) {
      console.error('Create journal entry error:', error);
      return res.status(500).json({ 
        error: 'Failed to create journal entry',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    console.log('Created journal entry:', data);

    return res.status(201).json({
      message: 'Journal entry created successfully',
      entry: data
    });

  } catch (error) {
    console.error('Create journal error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


/**
 * GET ALL JOURNAL ENTRIES
 * Optional Query: ?mood=happy
 */
const getJournalEntries = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { mood } = req.query;

    let query = supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (mood) {
      query = query.eq('mood', mood);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Fetch journal entries error:', error);
      
      // Check if table doesn't exist
      if (error.message?.includes('relation') || error.code === '42P01') {
        return res.status(200).json({
          count: 0,
          entries: [],
          message: 'Journal entries table not found. Please create the table in Supabase.'
        });
      }
      
      return res.status(500).json({ 
        error: 'Failed to fetch journal entries',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    return res.status(200).json({
      count: data?.length || 0,
      entries: data || []
    });

  } catch (error) {
    console.error('Get journal error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


/**
 * UPDATE JOURNAL ENTRY
 */
const updateJournalEntry = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { id } = req.params;
    const { content, mood } = req.body;

    if (!content && !mood) {
      return res.status(400).json({
        error: 'At least one field (content or mood) is required to update'
      });
    }

    // Check ownership
    const { data: existingEntry, error: fetchError } = await supabase
      .from('journal_entries')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!existingEntry || fetchError) {
      return res.status(404).json({
        error: 'Journal entry not found or unauthorized'
      });
    }

    const updateData = {};
    if (content !== undefined) updateData.content = content;
    if (mood !== undefined) updateData.mood = mood;

    const { data, error } = await supabase
      .from('journal_entries')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Update journal entry error:', error);
      return res.status(500).json({ 
        error: 'Failed to update journal entry',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    return res.status(200).json({
      message: 'Journal entry updated successfully',
      entry: data
    });

  } catch (error) {
    console.error('Update journal error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


/**
 * DELETE JOURNAL ENTRY
 */
const deleteJournalEntry = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { id } = req.params;

    // Check ownership
    const { data: existingEntry, error: fetchError } = await supabase
      .from('journal_entries')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!existingEntry || fetchError) {
      return res.status(404).json({
        error: 'Journal entry not found or unauthorized'
      });
    }

    const { error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Delete journal entry error:', error);
      return res.status(500).json({ 
        error: 'Failed to delete journal entry',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    return res.status(200).json({
      message: 'Journal entry deleted successfully'
    });

  } catch (error) {
    console.error('Delete journal error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};


export {
  createJournalEntry,
  getJournalEntries,
  updateJournalEntry,
  deleteJournalEntry
};