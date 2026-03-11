/** Reserved key for the draft version of an item. */
export const VERSION_KEY_DRAFT = 'draft' as const;

/**
 * Legacy published-version sentinel.
 * Kept for backwards-compat — clients and the SDK pass ?version=main.
 * Do not remove until the deprecation window closes.
 */
export const VERSION_KEY_PUBLISHED_LEGACY = 'main' as const;

/**
 * Reserved key identifying the published item within a version context
 */
export const VERSION_KEY_PUBLISHED = 'published' as const;
