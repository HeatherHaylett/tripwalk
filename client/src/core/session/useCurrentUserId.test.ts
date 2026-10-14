import { act, renderHook } from '@testing-library/react-native';
import { useSessionStore } from './sessionStore';
import { useCurrentUserId } from './useCurrentUserId';

test('returns the session user id with no error when a user is set', async () => {
  useSessionStore.setState({ userId: 'owner-a' });

  const { result } = await renderHook(() => useCurrentUserId());

  expect(result.current).toEqual({ userId: 'owner-a', error: '' });
});

test('returns no user id and an actionable error when no user is set', async () => {
  // EXPO_PUBLIC_DEV_USER_ID unset: the store holds undefined despite its type.
  useSessionStore.setState({ userId: undefined as unknown as string });

  const { result } = await renderHook(() => useCurrentUserId());

  expect(result.current.userId).toBeUndefined();
  expect(result.current.error).toMatch(/EXPO_PUBLIC_DEV_USER_ID/);
});

test('updates when the session user changes', async () => {
  useSessionStore.setState({ userId: 'owner-a' });
  const { result } = await renderHook(() => useCurrentUserId());

  await act(async () => {
    useSessionStore.setState({ userId: 'owner-b' });
  });

  expect(result.current.userId).toBe('owner-b');
});
