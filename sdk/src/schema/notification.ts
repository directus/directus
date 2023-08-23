import type { MergeCoreCollection } from '../index.js';
import type { DirectusUser } from './user.js';

export type DirectusNotification<Schema extends object> = MergeCoreCollection<
	Schema,
	'directus_notifications',
	{
		id: string;
		timestamp: 'datetime' | null;
		status: string | null;
		recipient: DirectusUser<Schema> | string;
		sender: DirectusUser<Schema> | string | null;
		subject: string;
		message: string | null;
		collection: string | null; // TODO keyof complete schema
		item: string | null;
	}
>;
