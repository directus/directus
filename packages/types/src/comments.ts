import type { PrimaryKey } from './items.js';
import type { User } from './users.js';

export type Comment = {
	id: string;
	collection: string;
	item: PrimaryKey;
	comment: string;
	date_created: string;
	date_updated: string;
	user_created: string | Partial<User>;
	user_updated: string | Partial<User>;
};
