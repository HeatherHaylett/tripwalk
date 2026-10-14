import { useEffect, useState } from 'react';
import { Database } from '@nozbe/watermelondb';
// THROWAWAY: exists only to prove the reactive-hook test pattern (#11).
// Not used by the app. See useTripCount.test.ts for the recipe.
export function useTripCount(db: Database) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    // `false` = unthrottled. With the default (throttled) observeCount(), the
    // second emission never arrived under Jest. See useTripCount.test.ts.
    const tripCount = db.get('trips').query().observeCount(false);
    const sub = tripCount.subscribe(setCount);
    return () => sub.unsubscribe();
  }, [db]);
  return count;
}
