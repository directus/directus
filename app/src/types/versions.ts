import type { ContentVersion } from '@directus/types';

export type ContentVersionWithType = ContentVersion & { type: 'local' | 'global' };

export type NewContentVersion = Pick<ContentVersionWithType, 'key' | 'name' | 'type'> & { id: '+' };

export type ContentVersionMaybeNew = ContentVersionWithType | NewContentVersion;
