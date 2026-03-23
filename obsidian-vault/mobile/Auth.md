# Mobile Authentication

## Overview

Mobile uses **Clerk** (`@clerk/clerk-expo`) — same auth provider as web. Users can sign in with:
- Email + password
- Google OAuth (Ionicons `logo-google` icon)
- Apple OAuth (Ionicons `logo-apple` icon, black button)

## Auth Token Injection

Mobile mirrors the web's token provider pattern. On mount, `ChatScreen` calls:

```typescript
api.setTokenProvider(getToken);  // from useAuth()
```

Every API call via `apiFetch()` then automatically attaches `Authorization: Bearer <jwt>` headers — identical to the web frontend's `lib/api.ts` pattern. This ensures all protected backend endpoints (create room, send message, etc.) work from mobile.

## User Sync

After login, mobile syncs the Clerk user to the backend:

```typescript
api.syncUser(userId, username, email, avatarUrl);
// Sends: { id, username, email, avatar_url } → POST /api/users/
```

**Important**: The backend's `UserCreate` model requires `id` (not `user_id`) and `email` is a required field.

## Flow

```
1. App launches → ClerkProvider wraps everything
2. AppNavigator checks useAuth().isSignedIn
3. Not signed in → SignInScreen / SignUpScreen
4. Signed in → ChatScreen
5. ChatScreen sets up token provider → api.setTokenProvider(getToken)
6. ChatScreen syncs user → api.syncUser(id, username, email, avatarUrl)
7. Token cached in expo-secure-store (persists across app restarts)
```

## ClerkProvider Setup (`App.tsx`)

```typescript
<ClerkProvider publishableKey={CLERK_KEY} tokenCache={tokenCache}>
  <SafeAreaProvider>
    <AppNavigator />
  </SafeAreaProvider>
</ClerkProvider>
```

- `CLERK_KEY` from `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` env var
- Same publishable key as web (shared Clerk project)

## Token Cache (`hooks/useTokenCache.ts`)

```typescript
const tokenCache: TokenCache = {
  getToken: (key) => SecureStore.getItemAsync(key),
  saveToken: (key, value) => SecureStore.setItemAsync(key, value),
};
```

Uses `expo-secure-store` → iOS Keychain / Android Keystore. Tokens persist across app restarts so users stay signed in.

## Sign In Screen

### Email/Password
1. User enters email + password
2. `signIn.create({ identifier: email, password })`
3. If `status === 'complete'` → `setActive({ session })` → navigates to chat

### Google OAuth
1. User taps "Continue with Google"
2. `useOAuth({ strategy: 'oauth_google' })` → `startOAuthFlow()`
3. Opens in-app browser via `expo-web-browser`
4. On success → `setActive({ session })` → navigates to chat

### Apple OAuth
Same flow as Google but with `oauth_apple` strategy.

## Sign Up Screen

### Email/Password
1. User enters username + email + password
2. `signUp.create({ emailAddress, password, username })`
3. `signUp.prepareEmailAddressVerification({ strategy: 'email_code' })`
4. UI switches to verification code input
5. User enters code → `signUp.attemptEmailAddressVerification({ code })`
6. If `status === 'complete'` → `setActive({ session })`

### OAuth
Same as sign-in — Google and Apple buttons at the top.

## Auth Guard (`navigation/AppNavigator.tsx`)

```typescript
const { isSignedIn, isLoaded } = useAuth();

if (!isLoaded) return <LoadingScreen />;

return (
  <Stack.Navigator>
    {isSignedIn ? (
      <Stack.Screen name="Chat" component={ChatScreen} />
    ) : (
      <>
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
      </>
    )}
  </Stack.Navigator>
);
```

When `isSignedIn` changes (sign in/out), React Navigation automatically transitions between auth screens and chat.

## Related
- [[mobile/Overview]]
- [[interview/Design Decisions]] (Why Clerk)
- [[frontend/Components]] (web auth via Clerk middleware)
