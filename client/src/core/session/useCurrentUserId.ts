import { useSessionStore } from './sessionStore';

const MISSING_USER_MESSAGE =
  'No user is set, so this cannot be loaded. Set EXPO_PUBLIC_DEV_USER_ID in client/.env and restart the app.';

// The current user's id, plus an actionable error when there isn't one.
// userId is undefined when EXPO_PUBLIC_DEV_USER_ID is unset (see
// sessionStore.ts), even though the store types it as string. Callers should
// check userId before using it (e.g. querying with undefined throws) and can
// show `error` instead. Subscribes to the store, so it re-renders on change.
export function useCurrentUserId(): {
  userId: string | undefined;
  error: string;
} {
  const userId: string | undefined = useSessionStore((state) => state.userId);
  return { userId, error: userId ? '' : MISSING_USER_MESSAGE };
}
