# Mobile Test Plan

> Manual QA checklist for verifying mobile-web parity. Run with `npx expo start` on device/simulator.

## 1. Sign Up (Email/Password)

| # | Step | Expected |
|---|------|----------|
| 1.1 | Open app, land on Sign In screen | See "Sign in to Townhall" with Google/Apple icons + email form |
| 1.2 | Tap "Sign up" link at bottom | Navigate to Sign Up screen |
| 1.3 | See Google button | Proper Google logo icon (Ionicons), not plain text "G" |
| 1.4 | See Apple button | Proper Apple logo icon, black button with white text |
| 1.5 | Leave all fields empty, tap Sign Up | Shows validation error |
| 1.6 | Enter username, email, password, tap Sign Up | Shows "Verify your email" screen |
| 1.7 | Enter the code from your email, tap Verify | Redirects to Chat screen, loads rooms |
| 1.8 | Open web app, sign in with same email | Same user, same rooms/messages visible |

## 2. Sign Up (Google OAuth)

| # | Step | Expected |
|---|------|----------|
| 2.1 | Tap "Continue with Google" on Sign Up | Opens Google OAuth browser flow |
| 2.2 | Complete Google sign-in | Returns to app, lands on Chat screen |
| 2.3 | Check user synced to backend | User appears in members panel with correct name/avatar |

## 3. Sign Up (Apple OAuth)

| # | Step | Expected |
|---|------|----------|
| 3.1 | Tap "Continue with Apple" on Sign Up | Opens Apple Sign In flow |
| 3.2 | Complete Apple sign-in | Returns to app, lands on Chat screen |

## 4. Sign In (Existing Account)

| # | Step | Expected |
|---|------|----------|
| 4.1 | Sign out from sidebar, land on Sign In | See sign in form |
| 4.2 | Enter existing email + password, tap Sign In | Loads Chat screen with your rooms |
| 4.3 | Wrong password | Shows error message, no crash |
| 4.4 | Sign in with Google (existing account) | Loads Chat screen |

## 5. User Sync (Mobile-Web Parity)

| # | Step | Expected |
|---|------|----------|
| 5.1 | Sign up on mobile with new account | User created in backend DB |
| 5.2 | Open web app, sign in with same credentials | Same user ID, same data |
| 5.3 | Send a message on web | Message appears on mobile (real-time via WebSocket) |
| 5.4 | Send a message on mobile | Message appears on web |

## 6. Chat Functionality

| # | Step | Expected |
|---|------|----------|
| 6.1 | Rooms load after sign in | See room list (or auto-created #general) |
| 6.2 | Tap hamburger to open sidebar | Sidebar drawer slides in with rooms |
| 6.3 | Select a different room | Messages + members reload for that room |
| 6.4 | Type a message and send | Message appears instantly (optimistic), persists on refresh |
| 6.5 | Open members panel | See list of room members |
| 6.6 | Create a new room from sidebar | Room appears in list, can switch to it |

## 7. Auth Token Verification

| # | Step | Expected |
|---|------|----------|
| 7.1 | Sign in, send a message | Message sends successfully (200) |
| 7.2 | Check backend logs / network tab | Requests include `Authorization: Bearer <jwt>` header |
| 7.3 | Create a room | Room creates successfully (protected endpoint works) |

## 8. Sign Out

| # | Step | Expected |
|---|------|----------|
| 8.1 | Open sidebar, tap sign out | Returns to Sign In screen |
| 8.2 | Kill and reopen app | Still on Sign In screen (session cleared) |

## 9. App Branding

| # | Step | Expected |
|---|------|----------|
| 9.1 | Check app name on home screen | Shows "Townhall" |
| 9.2 | Check app icon | Black background with white pillared building |
| 9.3 | Sign Up screen says "Join Townhall" | Correct branding |
| 9.4 | Sign In screen says "Sign in to Townhall" | Correct branding |

## 10. Error Handling

| # | Step | Expected |
|---|------|----------|
| 10.1 | Turn off backend, try to sign in | App doesn't crash, shows error or empty state |
| 10.2 | Turn off wifi, send a message | Optimistic message rolls back, no crash |
| 10.3 | Enter invalid email on sign up | Clerk shows validation error |

## Bugs Fixed (This Round)

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| Signup 422 error | `syncUser` sent `user_id` instead of `id`, missing required `email` | Fixed field names + added email param |
| All API calls unauthenticated | No token injection (web had `setTokenProvider`) | Added `apiFetch` + `setTokenProvider` pattern |
| `sendMessage` 422 error | Sent `user_id`/`username` instead of `sender_id`/`sender_name` | Fixed field names in API body |
| OAuth buttons had text icons | Used plain "G" and Unicode char | Replaced with Ionicons `logo-google`/`logo-apple` |

## Related
- [[mobile/Auth]]
- [[mobile/API Client]]
- [[mobile/Components]]
- [[frontend/Feature Status]]
