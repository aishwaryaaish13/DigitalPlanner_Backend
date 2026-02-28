import supabase from '../config/supabase.js';
import { sendNotification } from '../config/socket.js';

// Get all notifications for a user
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { limit = 50, unread_only = false } = req.query;

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (unread_only === 'true') {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Get notifications error:', error);
      
      // Check if table doesn't exist
      if (error.message?.includes('relation') || error.code === '42P01') {
        return res.status(200).json({
          message: 'Notifications table not created yet. Run supabase_notifications_table.sql',
          notifications: []
        });
      }
      
      throw error;
    }

    return res.status(200).json({
      message: 'Notifications retrieved successfully',
      notifications: data || []
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    return res.status(500).json({ 
      error: 'Failed to retrieve notifications',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Mark notification as read
const markAsRead = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Mark as read error:', error);
      
      if (error.message?.includes('relation') || error.code === '42P01') {
        return res.status(404).json({ 
          error: 'Notifications table not created yet. Run supabase_notifications_table.sql'
        });
      }
      
      throw error;
    }

    if (!data) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    return res.status(200).json({
      message: 'Notification marked as read',
      notification: data
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    return res.status(500).json({ 
      error: 'Failed to mark notification as read',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Mark all as read error:', error);
      
      if (error.message?.includes('relation') || error.code === '42P01') {
        return res.status(404).json({ 
          error: 'Notifications table not created yet. Run supabase_notifications_table.sql'
        });
      }
      
      throw error;
    }

    return res.status(200).json({
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    return res.status(500).json({ 
      error: 'Failed to mark all notifications as read',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete notification
const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { id } = req.params;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Delete notification error:', error);
      
      if (error.message?.includes('relation') || error.code === '42P01') {
        return res.status(404).json({ 
          error: 'Notifications table not created yet. Run supabase_notifications_table.sql'
        });
      }
      
      throw error;
    }

    return res.status(200).json({
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    return res.status(500).json({ 
      error: 'Failed to delete notification',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create notification (internal use)
const createNotification = async (userId, notificationData) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data || null,
        is_read: false
      }])
      .select()
      .single();

    if (error) throw error;

    // Send real-time notification
    sendNotification(userId, {
      ...data,
      action: 'new_notification'
    });

    return data;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

export {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification
};
