# Single Database Architecture for FlashApps

Since Deno Deploy only supports one database per app, we'll use the following architecture:

## User Management Strategy

1. **Each app maintains its own users database**
   - Users are stored with a `SharedUser` structure that supports multiple platforms
   - When a user signs up on BookWorm, they get a `platforms.bookworm` entry
   - If they later use SightWords, that app will have its own user record with `platforms.sightwords`

2. **Cross-App Authentication via API**
   - Each app exposes a `/api/auth/check-user` endpoint
   - When a user logs into a new app, it can check other FlashApps for existing accounts
   - This allows email/password reuse across apps

3. **User Data Structure**
   ```typescript
   SharedUser {
     id: string
     email: string
     passwordHash: string
     displayName: string
     platforms: {
       bookworm?: {
         role: "teacher" | "parent" | "delegate"
         schoolId: string | null
         // ... platform-specific data
       }
       sightwords?: {
         // ... sightwords-specific data
       }
     }
   }
   ```

4. **Future OAuth Integration**
   - Google OAuth can work across apps with shared client ID
   - Each app handles its own OAuth callback but can check for existing users

## Implementation Plan

1. Keep the current `SharedUser` structure
2. Each app stores its own users
3. Future: Add API endpoints for cross-app user checking
4. Future: Implement OAuth token sharing mechanism

This approach works within Deno Deploy's constraints while still allowing for a good user experience across the FlashApps ecosystem.