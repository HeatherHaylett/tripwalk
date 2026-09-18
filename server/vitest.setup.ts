import './src/env';

// db.ts reads process.env.DATABASE_URL the moment it's imported. Overwriting
// it here, before any test file imports db.ts, points the app's one shared
// `db` client at the `test` Neon branch instead of production — with zero
// changes to db.ts itself.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
