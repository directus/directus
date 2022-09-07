import type { User } from './users.js';

export type Share = {
	id: string;
	name: string;
	collection: string;
	item: string;
	role: string;
	password: string;
	user_created: string | User;
	date_created: string;
	date_start: string | null;
	date_end: string | null;
	times_used: number;
	max_uses: number | null;
};
