# Productivity Tracking API Documentation

## Overview
The productivity tracking feature allows users to track their task completions, goals, focus sessions, and unlock badges based on their achievements.

## Database Setup

Run the SQL script to create the table:
```bash
# Execute supabase_productivity_table.sql in your Supabase SQL editor
```

The table includes:
- `id` - UUID primary key
- `user_id` - UUID foreign key to auth.users table
- `completed_days` - JSONB array of dates with completed tasks
- `productivity_data` - JSONB object mapping dates to task counts
- `tasks_completed` - Total tasks completed counter
- `goals_completed` - Total goals completed counter
- `total_goals` - Total number of goals set
- `focus_sessions` - Total focus sessions completed
- `unlocked_badges` - JSONB array of badge IDs

## API Endpoints

All endpoints require authentication via Bearer token in the Authorization header.

### GET /api/productivity
Get user's productivity data.

**Response (200):**
```json
{
  "id": 1,
  "user_id": 123,
  "completed_days": ["2026-02-27", "2026-02-28"],
  "productivity_data": {"2026-02-27": 5, "2026-02-28": 3},
  "tasks_completed": 8,
  "goals_completed": 2,
  "total_goals": 5,
  "focus_sessions": 3,
  "unlocked_badges": ["tasks_10"],
  "created_at": "2026-02-27T10:00:00.000Z",
  "updated_at": "2026-02-27T15:30:00.000Z"
}
```

**Response (404):** Productivity record not found

---

### POST /api/productivity/initialize
Create initial productivity record for a new user.

**Response (201):**
```json
{
  "message": "Productivity tracking initialized successfully",
  "productivity": { ... }
}
```

**Response (200):** If record already exists

---

### POST /api/productivity/task-complete
Mark a task as completed for a specific date.

**Request Body:**
```json
{
  "date": "2026-02-27"
}
```

**Actions:**
- Adds date to `completed_days` array (if not exists)
- Increments count in `productivity_data` for that date
- Increments `tasks_completed` counter

**Response (200):**
```json
{
  "message": "Task completion recorded successfully",
  "productivity": { ... }
}
```

---

### POST /api/productivity/task-uncomplete
Mark a task as uncompleted for a specific date.

**Request Body:**
```json
{
  "date": "2026-02-27"
}
```

**Actions:**
- Decrements count in `productivity_data` for that date
- Removes date entry if count reaches 0
- Decrements `tasks_completed` counter (minimum 0)

**Response (200):**
```json
{
  "message": "Task uncompletion recorded successfully",
  "productivity": { ... }
}
```

---

### POST /api/productivity/goal-complete
Increment the goals completed counter.

**Response (200):**
```json
{
  "message": "Goal completion recorded successfully",
  "productivity": { ... }
}
```

---

### PUT /api/productivity/total-goals
Update the total goals count.

**Request Body:**
```json
{
  "count": 10
}
```

**Response (200):**
```json
{
  "message": "Total goals updated successfully",
  "productivity": { ... }
}
```

---

### POST /api/productivity/focus-complete
Increment the focus sessions counter.

**Response (200):**
```json
{
  "message": "Focus session recorded successfully",
  "productivity": { ... }
}
```

---

### POST /api/productivity/unlock-badge
Add a badge to the user's unlocked badges.

**Request Body:**
```json
{
  "badgeId": "tasks_10"
}
```

**Actions:**
- Adds `badgeId` to `unlocked_badges` array if not already present

**Response (200):**
```json
{
  "message": "Badge unlocked successfully",
  "productivity": { ... }
}
```

## Error Responses

All endpoints may return:
- **400** - Bad request (missing or invalid parameters)
- **401** - Unauthorized (missing or invalid token)
- **404** - Productivity record not found
- **500** - Internal server error

## Usage Example

```javascript
// Initialize productivity tracking for new user
const initResponse = await fetch('http://localhost:5000/api/productivity/initialize', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Complete a task
const completeResponse = await fetch('http://localhost:5000/api/productivity/task-complete', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ date: '2026-02-27' })
});

// Get productivity data
const dataResponse = await fetch('http://localhost:5000/api/productivity', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await dataResponse.json();
```

## Notes

- All JSON fields (completed_days, productivity_data, unlocked_badges) are stored as JSONB in PostgreSQL
- The `updated_at` timestamp is automatically updated on any record modification
- Row Level Security (RLS) is enabled - users can only access their own data
- All counters have minimum value of 0 (no negative values)
- Dates should be in ISO format (YYYY-MM-DD)
