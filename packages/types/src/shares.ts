import type { User } from './users.js';

export type Share = {
	id: string;
	name: string | null;
	collection: string;
	item: string;
	role: string | null;
	password: string | null;
	user_created: string | User | null;
	date_created: string;
	date_start: string | null;
	date_end: string | null;
	times_used: number | null;
	max_uses: number | null;
};
