import { create } from 'zustand';

// Temporary, dev-only placeholder — mirrors server/src/plugins/authStub.ts.
// Real auth method is still undecided (PRD.md §7); there is no login flow
// yet, so there is nothing to derive a real userId from. This stands in for
// "the current user" until real auth exists. A real login flow should only
// need to add a setter here and call it on sign-in — nothing that reads
// `userId` from this store should need to change.
//
// Required: set EXPO_PUBLIC_DEV_USER_ID in client/.env (see client/.env.example
// and README.md). It should be the ID of a user that exists on the server you
// point at (e.g. one seeded in a Neon test branch) so requests actually match
// a real owner. There is deliberately no fallback value: a made-up ID would
// silently fail against the server. If it is unset, `userId` is `undefined`
// (this is also the case under Jest, which does not load .env; tests should
// pass an explicit ownerId instead of reading this store).
const DEV_PLACEHOLDER_USER_ID = process.env.EXPO_PUBLIC_DEV_USER_ID;

interface SessionState {
  userId: string;
}

export const useSessionStore = create<SessionState>(() => ({
  userId: DEV_PLACEHOLDER_USER_ID,
}));
