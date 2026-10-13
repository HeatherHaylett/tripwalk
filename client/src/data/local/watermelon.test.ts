import { createContainer } from '@/core/di/container';
import { createLokiAdapter } from '@/test_utils';
import { Bookmark as BookmarkModel } from './models/Bookmark';

test(`Watermelon record's id matches a UUID pattern`, async () => {
  const lokiAdapter = createLokiAdapter();
  const { database } = createContainer(lokiAdapter);

  const newBookmarkModel = await database.write(async () => {
    return await database.get<BookmarkModel>('bookmarks').create((bookmark) => {
      bookmark.bookmarkedAt = new Date(Date.now());
    });
  });

  expect(newBookmarkModel.id).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );
});

test(`each new Watermelon record gets a distinct id`, async () => {
  const lokiAdapter = createLokiAdapter();
  const { database } = createContainer(lokiAdapter);

  const [first, second] = await database.write(async () => {
    const bookmarks = database.get<BookmarkModel>('bookmarks');
    return Promise.all([
      bookmarks.create((bookmark) => {
        bookmark.bookmarkedAt = new Date(Date.now());
      }),
      bookmarks.create((bookmark) => {
        bookmark.bookmarkedAt = new Date(Date.now());
      }),
    ]);
  });

  expect(first.id).not.toBe(second.id);
});
