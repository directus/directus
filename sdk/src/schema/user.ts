import type { MergeCoreCollection } from '../index.js';
import type { DirectusAccess } from './access.js';
import type { DirectusFile } from './file.js';
import type { DirectusRole } from './role.js';

/**
 * directus_users type
 */
export type DirectusUser<Schema = any> = MergeCoreCollection<
	Schema,
	'directus_users',
	{
		id: string; // uuid
		status: 'draft' | 'invited' | 'unverified' | 'active' | 'suspended' | 'archived' | 'inactive-license';
		first_name: string | null;
		last_name: string | null;
		email: string | null;
		password: string | null; // will just be *s
		token: string | null;
		last_access: 'datetime' | null;
		last_page: string | null;
		external_identifier: string | null;
		tfa_secret: string | null;
		auth_data: Record<string, any> | null;
		provider: string;
		appearance: 'auto' | 'dark' | 'light' | null;
		theme_light: string | null;
		theme_dark: string | null;
		theme_light_overrides: Record<string, unknown> | null;
		theme_dark_overrides: Record<string, unknown> | null;
		role: DirectusRole<Schema> | string | null;
		policies: string[] | DirectusAccess<Schema>[];
		language: string | null;
		text_direction: 'ltr' | 'rtl' | 'auto';
		avatar: DirectusFile<Schema> | string | null;
		title: string | null;
		description: string | null;
		location: string | null;
		tags: string[] | null;
		email_notifications: boolean | null;
	}
>;
