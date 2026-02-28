import supabase from '../config/supabase.js';
import { sendEventNotification } from '../config/socket.js';

// Get all events for a user
const getEvents = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (error) throw error;

    return res.status(200).json({
      message: 'Events retrieved successfully',
      events: data
    });
  } catch (error) {
    console.error('Get events error:', error);
    return res.status(500).json({ error: 'Failed to retrieve events' });
  }
};

// Get events for a specific date
const getEventsByDate = async (req, res) => {
  try {
    const userId = req.user.id;
    const { date } = req.params;

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .order('time', { ascending: true });

    if (error) throw error;

    return res.status(200).json({
      message: 'Events retrieved successfully',
      events: data
    });
  } catch (error) {
    console.error('Get events by date error:', error);
    return res.status(500).json({ error: 'Failed to retrieve events' });
  }
};

// Create a new event
const createEvent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, date, time, description } = req.body;

    if (!title || !date) {
      return res.status(400).json({ error: 'Title and date are required' });
    }

    const { data, error } = await supabase
      .from('events')
      .insert([{
        user_id: userId,
        title,
        date,
        time: time || null,
        description: description || null
      }])
      .select()
      .single();

    if (error) throw error;

    // Send real-time notification
    sendEventNotification(userId, data, 'created');

    return res.status(201).json({
      message: 'Event created successfully',
      event: data
    });
  } catch (error) {
    console.error('Create event error:', error);
    return res.status(500).json({ error: 'Failed to create event' });
  }
};

// Update an event
const updateEvent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, date, time, description } = req.body;

    const { data, error } = await supabase
      .from('events')
      .update({
        title,
        date,
        time,
        description,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Send real-time notification
    sendEventNotification(userId, data, 'updated');

    return res.status(200).json({
      message: 'Event updated successfully',
      event: data
    });
  } catch (error) {
    console.error('Update event error:', error);
    return res.status(500).json({ error: 'Failed to update event' });
  }
};

// Delete an event
const deleteEvent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;

    // Send real-time notification
    sendEventNotification(userId, { id, title: 'Event' }, 'deleted');

    return res.status(200).json({
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    return res.status(500).json({ error: 'Failed to delete event' });
  }
};

export {
  getEvents,
  getEventsByDate,
  createEvent,
  updateEvent,
  deleteEvent
};
