import { createContainer } from './container';
import { createLokiAdapter } from '@/test_utils';

test('construct a real (in-memory) WatermelonDB Database instance without touching native code, via the DI container.', async () => {
  const lokiAdapter = createLokiAdapter();
  const { database } = createContainer(lokiAdapter);

  expect(await database.get('trips').query().fetchCount()).toStrictEqual(0);
});
