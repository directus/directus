import type { DirectusRole, MergeCoreCollection } from '../index.js';
import type { DirectusFile } from './file.js';

/**
 * directus_users type
 */
export type DirectusUser<Schema extends object> = MergeCoreCollection<
	Schema,
	'directus_users',
	{
		id: string; // uuid
		first_name: string | null;
		last_name: string | null;
		email: string | null;
		password: string | null; // will just be *s
		location: string | null;
		title: string | null;
		description: string | null;
		tags: string[] | null;
		avatar: DirectusFile<Schema> | string | null;
		language: string | null;
		theme: string | null;
		tfa_secret: string | null;
		status: string;
		role: DirectusRole<Schema> | string | null;
		token: string | null;
		last_access: 'datetime' | null;
		last_page: string | null;
		provider: string;
		external_identifier: string | null;
		auth_data: Record<string, any> | null;
		email_notifications: boolean | null;
	}
>;
