import { create } from 'zustand';

// Temporary, dev-only placeholder — mirrors server/src/plugins/authStub.ts.
// Real auth method is still undecided (PRD.md §7); there is no login flow
// yet, so there is nothing to derive a real userId from. This stands in for
// "the current user" until real auth exists. A real login flow should only
// need to add a setter here and call it on sign-in — nothing that reads
// `userId` from this store should need to change.
//
// Overridable via EXPO_PUBLIC_DEV_USER_ID (see client/.env) so this can be
// pointed at a specific seeded user (e.g. one that already exists in a Neon
// test branch) without editing code. Falls back to a fixed literal so the
// app still runs with no env setup at all.
const DEV_PLACEHOLDER_USER_ID = process.env.EXPO_PUBLIC_DEV_USER_ID;

interface SessionState {
  userId: string;
}

export const useSessionStore = create<SessionState>(() => ({
  userId: DEV_PLACEHOLDER_USER_ID,
}));
