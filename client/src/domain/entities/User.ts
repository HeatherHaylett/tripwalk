export interface User {
  userId: string;
  username: string;
  // Auth fields (email, etc.) intentionally omitted — auth method is still
  // an open decision. See PRD.md §7. Don't guess the shape here.
}

export interface Bookmark {
  bookmarkId: string;
  userId: string;
  publicTripId: string;
  bookmarkedAt: number; // sort key for the "My Bookmarks" list
}
