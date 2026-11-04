import type { CollectionName, MergeCoreCollection, StringLiteralUnion } from '../index.js';
import type { DirectusUser } from './user.js';

export type DirectusNotification<Schema = any> = MergeCoreCollection<
	Schema,
	'directus_notifications',
	{
		id: number;
		timestamp: 'datetime' | null;
		status: StringLiteralUnion<'inbox' | 'archived'> | null;
		recipient: DirectusUser<Schema> | string;
		sender: DirectusUser<Schema> | string | null;
		subject: string;
		message: string | null;
		collection: CollectionName<Schema> | null;
		item: string | null;
	}
>;
