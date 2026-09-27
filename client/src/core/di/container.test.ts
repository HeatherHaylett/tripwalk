import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import { schema } from '@/data/local/schema';
import { createContainer } from './container';

test('construct a real (in-memory) WatermelonDB Database instance without touching native code, via the DI container.', async () => {
  const lokiAdapter = new LokiJSAdapter({
    schema,
    useWebWorker: false,
    useIncrementalIndexedDB: false,
  });

  const database = createContainer(lokiAdapter);

  expect(await database.get('trips').query().fetchCount()).toStrictEqual(0);
});
