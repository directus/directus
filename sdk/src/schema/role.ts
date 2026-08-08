import type { DirectusAccess } from './access.js';
import type { DirectusUser } from './user.js';

export interface DirectusRole<Schema = any> {
	id: string;
	name: string;
	icon: string;
	description: string | null;
	parent: string | DirectusRole<Schema> | null;
	children: string[] | DirectusRole<Schema>[];
	policies: string[] | DirectusAccess<Schema>[];
	users: string[] | DirectusUser<Schema>[];
}
