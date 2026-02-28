import supabase from '../config/supabase.js';

const createTask = async (req, res) => {
  try {
    const userId = req.user && (req.user.userId || req.user.id);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized: missing user ID' });
    }

    const { title, description, due_date, priority } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const insertObj = {
      user_id: userId,
      title,
      description: description || null,
      due_date: due_date || null,
      priority: priority || 'medium',
      completed: false
    };

    const attemptInsert = async (obj) => {
      return await supabase.from('tasks').insert([obj]).select().maybeSingle();
    };

    let result = await attemptInsert(insertObj);

    if (result.error) {
      const err = result.error;
      const text = (err.message || err.details || '').toString();
      const match = text.match(/Could not find the '([^']+)' column|column "([^"]+)"/i);
      const missingColumn = match ? (match[1] || match[2]) : null;

      if (missingColumn) {
        console.warn(`Supabase missing column detected: ${missingColumn}. Retrying without that field.`);
        const safeObj = { ...insertObj };
        if (missingColumn in safeObj) delete safeObj[missingColumn];
        const camel = missingColumn.replace(/_([a-z])/g, g => g[1].toUpperCase());
        if (camel in safeObj) delete safeObj[camel];
        result = await attemptInsert(safeObj);
      }
    }

    if (result.error) {
      console.error('Create task error:', result.error);
      const message = process.env.NODE_ENV === 'development' 
        ? (result.error.message || JSON.stringify(result.error)) 
        : 'Failed to create task';
      return res.status(500).json({ error: message });
    }

    const task = result.data;
    return res.status(201).json({ message: 'Task created successfully', task });
  } catch (error) {
    console.error('Create task error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getTasks = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get tasks error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch tasks',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    return res.status(200).json({ tasks: tasks || [], count: tasks?.length || 0 });
  } catch (error) {
    console.error('Get tasks error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const updateTask = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { id } = req.params;
    const { title, description, due_date, priority, completed } = req.body;

    console.log('Update request:', { id, userId, body: req.body });

    // Verify task exists and belongs to user
    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!existingTask || fetchError) {
      console.error('Task not found:', { id, userId, fetchError });
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    console.log('Existing task:', existingTask);

    // Build update object
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (due_date !== undefined) updateData.due_date = due_date;
    if (priority !== undefined) updateData.priority = priority;
    if (completed !== undefined) updateData.completed = completed;

    console.log('Update data:', updateData);

    // If no fields to update, return existing task
    if (Object.keys(updateData).length === 0) {
      return res.status(200).json({ 
        message: 'No changes to update', 
        task: existingTask 
      });
    }

    // Perform update - FIXED: Use .single() instead of .maybeSingle()
    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    console.log('Update result:', { updatedTask, updateError });

    if (updateError) {
      console.error('Update task error:', updateError);
      return res.status(500).json({ 
        error: 'Failed to update task',
        details: process.env.NODE_ENV === 'development' ? updateError.message : undefined
      });
    }

    // Verify the update was successful
    if (!updatedTask) {
      console.error('Update succeeded but no data returned');
      // Fetch the task again to get the updated data
      const { data: refetchedTask, error: refetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id)
        .single();

      if (refetchError || !refetchedTask) {
        console.error('Failed to refetch task:', refetchError);
        return res.status(500).json({ error: 'Failed to verify update' });
      }

      console.log('Refetched task:', refetchedTask);
      return res.status(200).json({ 
        message: 'Task updated successfully', 
        task: refetchedTask 
      });
    }

    console.log('Returning updated task:', updatedTask);
    return res.status(200).json({ 
      message: 'Task updated successfully', 
      task: updatedTask 
    });
  } catch (error) {
    console.error('Update task error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const deleteTask = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { id } = req.params;

    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!existingTask || fetchError) {
      return res.status(404).json({ error: 'Task not found or unauthorized' });
    }

    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Delete task error:', deleteError);
      return res.status(500).json({ 
        error: 'Failed to delete task',
        details: process.env.NODE_ENV === 'development' ? deleteError.message : undefined
      });
    }

    return res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export { createTask, getTasks, updateTask, deleteTask };
