import type { AllCollections, MergeCoreCollection, SingletonCollections } from '../index.js';
import type { DirectusUser } from './user.js';

export type DirectusNotification<Schema = any> = MergeCoreCollection<
	Schema,
	'directus_notifications',
	{
		id: number;
		timestamp: 'datetime' | null;
		status: string | null;
		recipient: DirectusUser<Schema> | string;
		sender: DirectusUser<Schema> | string | null;
		subject: string;
		message: string | null;
		collection: (AllCollections<Schema> | SingletonCollections<Schema>) | null;
		item: string | null;
	}
>;
