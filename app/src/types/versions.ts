import type { ContentVersion } from '@directus/types';

/**
 * Types of content versions:
 * - `local`: Versions that exist per individual item.
 * - `global`: Versions that exist across all items in a versioned collection.
 */
export type ContentVersionWithType = ContentVersion & { type: 'local' | 'global' };

export type NewContentVersion = Pick<ContentVersionWithType, 'key' | 'name' | 'type'> & { id: '+' };

export type ContentVersionMaybeNew = ContentVersionWithType | NewContentVersion;
