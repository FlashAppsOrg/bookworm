# Deno Deploy Database Setup Guide

## Overview
We're separating databases to have a shared users database across all FlashApps and platform-specific databases for each app.

## Step 1: Database Setup in Deno Deploy

Your databases are already created:
- `users-db` - Shared users database (for all FlashApps)
- `bookworm-db` - Bookworm-specific data
- `sightwords-db` - Sightwords-specific data

## Step 2: Assign Databases to Apps

In Deno Deploy dashboard:
1. Click "Assign" on `users-db` → Select BOTH `bookworm` and `sightwords` apps
2. Keep `bookworm-db` assigned to `bookworm` app only
3. Assign `sightwords-db` to `sightwords` app only

This allows both apps to share the users database while keeping their data separate.

## Step 3: Environment Variables

Your existing variables remain the same:
```bash
# Your existing variables (no database IDs needed anymore!)
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
CUSTOM_BOOKWORM_DOMAIN=bookworm.flashapps.org
# etc...
```

The app will automatically connect to the assigned databases by name.

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