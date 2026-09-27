import { createContainer } from '@/core/di/container';
import { createSQLiteAdapter } from '@/data/local/watermelon';

export const { tripRepository } = createContainer(createSQLiteAdapter());
