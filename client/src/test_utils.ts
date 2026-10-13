import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs';
import { schema } from '@/data/local/schema';

export const createLokiAdapter = () => {
  return new LokiJSAdapter({
    schema,
    useWebWorker: false,
    useIncrementalIndexedDB: false,
    extraLokiOptions: {
      autosave: false,
    },
  });
};
