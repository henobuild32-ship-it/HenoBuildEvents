# Task 2-b: Notifications Backend API

## Summary
Built the complete Notifications Backend API for the HenoBuild Event platform, replacing the simulated data with real database-backed endpoints. All 6 API endpoints are fully functional with auth verification, and seed data has been populated for the test user.

## Endpoints Created

### 1. GET /api/notifications?userId=xxx
- Lists all notifications for a user
- Includes related `event` (id, title) and `guest` (id, firstName, lastName) data
- Sorted by newest first (`createdAt: desc`)
- Auth required via Bearer token

### 2. POST /api/notifications
- Creates a new notification
- Validates with Zod: userId (required), type, title (required), message (required), eventId (optional), guestId (optional), link (optional)
- Verifies user, event, and guest existence
- Returns created notification with event/guest relations
- Auth required via Bearer token

### 3. PUT /api/notifications/[id]/read
- Marks a single notification as read
- Sets `isRead: true` and `readAt: current timestamp`
- Validates ownership (notification must belong to authenticated user)
- Auth required, ownership check enforced

### 4. PUT /api/notifications/read-all?userId=xxx
- Marks all unread notifications as read for a user
- Returns count of updated notifications
- Validates userId matches authenticated session
- Auth required, userId must match session

### 5. DELETE /api/notifications/[id]
- Deletes a notification by ID
- Validates ownership (notification must belong to authenticated user)
- Auth required, ownership check enforced

### 6. GET /api/notifications/count?userId=xxx
- Returns `unreadCount` and `totalCount` for a user
- Auth required via Bearer token

## Files Created
- `src/app/api/notifications/route.ts` — GET + POST
- `src/app/api/notifications/[id]/route.ts` — DELETE
- `src/app/api/notifications/[id]/read/route.ts` — PUT (mark as read)
- `src/app/api/notifications/read-all/route.ts` — PUT (mark all as read)
- `src/app/api/notifications/count/route.ts` — GET (unread count)
- `prisma/seed-notifications.ts` — Seed script for test data

## Seed Data
9 notifications created for test@henobuild.com:
- 4 unread: EVENT_REMINDER, RSVP_CONFIRMED, GUEST_ARRIVED, MESSAGE_RECEIVED
- 5 read: TABLE_ASSIGNED, INVITATION_SENT, RSVP_DECLINED, EVENT_UPDATED, GENERAL
- Linked to "Mariage de Sarah & Karim" event and 5 guests

## Auth Pattern
All endpoints verify the Authorization header (Bearer token) using `validateToken` from `@/lib/auth`. Write/delete operations enforce ownership checks to ensure users can only modify their own notifications.

## Verification
- ✅ Lint passes with no errors
- ✅ Database schema in sync (no modifications needed)
- ✅ Seed script executed successfully
- ✅ Dev server running without errors
