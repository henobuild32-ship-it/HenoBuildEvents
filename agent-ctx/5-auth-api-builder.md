# Task 5 - Auth & API Builder

## Task: Build complete authentication system and core API routes

## Work Log

- Reviewed existing project structure, Prisma schema (9 models, 6 enums), and Zustand store
- Created auth helper library (`lib/auth.ts`) with simple token-based session management (in-memory token store, SHA-256 password hashing, token generation/validation/destroy)
- Built all required API routes with zod validation, TypeScript types, and French error messages

## Files Created

### Auth Library
- `src/lib/auth.ts` - Token management, password hashing, session CRUD

### Auth API Routes
- `src/app/api/auth/register/route.ts` - POST: Register new user with validation
- `src/app/api/auth/login/route.ts` - POST: Login with credential validation
- `src/app/api/auth/me/route.ts` - GET: Get current user from Bearer token

### Event API Routes
- `src/app/api/events/route.ts` - POST: Create event (auto slug), GET: List by organizerId with counts
- `src/app/api/events/[id]/route.ts` - GET (with stats), PUT, DELETE (with ownership check)

### Guest API Routes
- `src/app/api/guests/route.ts` - POST: Add guest (auto QR code), GET: List with filter/search
- `src/app/api/guests/[id]/route.ts` - PUT (with table reassignment), DELETE (with occupancy cleanup)

### Table API Routes
- `src/app/api/tables/route.ts` - POST: Create table (unique number check), GET: List with guest details
- `src/app/api/tables/[id]/route.ts` - PUT (capacity validation), DELETE (with guest unassignment)

### Invitation API Routes
- `src/app/api/invitations/route.ts` - POST: Create invitation (unique link + QR data), GET: List by eventId
- `src/app/api/invitations/[link]/route.ts` - GET: Invitation by link (with expiry check)
- `src/app/api/invitations/[link]/rsvp/route.ts` - POST: RSVP accept/decline (with notification)

### Gallery API Routes
- `src/app/api/gallery/route.ts` - POST: Add item, GET: List with type/album filters

### Stats API Route
- `src/app/api/stats/route.ts` - GET: Comprehensive dashboard stats

## Key Design Decisions

1. **Simple token auth** - In-memory token store with 24h expiry, Bearer token in Authorization header
2. **SHA-256 hashing** - Per task requirements, using crypto.createHash instead of bcrypt
3. **Auto table occupancy** - Guest create/update/delete automatically adjusts table currentOccupancy
4. **Slug generation** - Auto-generates URL-friendly slug from event title with uniqueness check
5. **RSVP notifications** - Organizer receives notification when guest accepts/declines
6. **French error messages** - All API errors in French matching the platform's locale
7. **Ownership verification** - All mutation endpoints verify the authenticated user owns the resource

## Stage Summary

- 14 API route files + 1 auth library file created
- Full CRUD for Events, Guests, Tables, Gallery
- Complete invitation flow with RSVP
- Comprehensive stats endpoint
- All routes pass ESLint with 0 errors
