# Deno Deploy Database Setup Guide

## Overview
We're separating databases to have a shared users database across all FlashApps and platform-specific databases for each app.

## Step 1: Create Databases in Deno Deploy

1. Go to https://dash.deno.com/account#kv
2. Create two KV databases:
   - `flashapps-users` (shared across all apps)
   - `bookworm-data` (bookworm-specific)

3. Note the database IDs (they look like: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

## Step 2: Configure Environment Variables

In your Deno Deploy project settings, add:

```bash
# Shared users database
FLASHAPPS_USERS_KV_ID=your-users-db-id-here

# Bookworm-specific database
BOOKWORM_KV_ID=your-bookworm-db-id-here

# Your existing variables
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
CUSTOM_BOOKWORM_DOMAIN=bookworm.flashapps.org
# etc...
```

## Step 3: Run Migration

### Test Migration (Dry Run)
```bash
deno run --allow-all scripts/migrate-to-shared-db.ts --dry-run
```

### Execute Migration
```bash
deno run --allow-all scripts/migrate-to-shared-db.ts --execute
```

## Step 4: Update Connection Code

The app now uses `db-shared.ts` which handles dual connections:
- Users go to shared database
- Books, challenges, etc. stay in bookworm database

## Benefits of This Architecture

1. **Single Sign-On**: Users have one account for all FlashApps
2. **Cross-Platform Delegates**: Teachers can have helpers across apps
3. **Unified Parent Accounts**: Parents access all their children's apps
4. **Easier Scaling**: Add new apps without user duplication
5. **Better Analytics**: See user engagement across platforms

## For Sightwords App

Update sightwords to use the same shared users database:
```typescript
// In sightwords-app/utils/db.ts
import { getUsersKv } from "./db-shared.ts";

// Use getUsersKv() for authentication
// Keep sightwords-specific data in SIGHTWORDS_KV
```

## Database Schema

### Shared Users Database
- `users:id:{userId}` → SharedUser
- `users:email:{email}` → SharedUser
- `students:{studentId}` → Student
- `parent_students:{parentId}:{studentId}` → Relationship

### Bookworm Database
- `schools:id:{schoolId}` → School
- `classroomBooks:{userId}:{bookId}` → ClassroomBook
- `challenges:{challengeId}` → BookChallenge
- `user_platform_data:{userId}` → Platform-specific user data

### Sightwords Database (separate)
- `word_lists:{userId}:{listId}` → WordList
- `progress:{userId}:{childId}` → Progress
- etc...