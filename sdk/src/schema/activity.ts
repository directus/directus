import type { CoreCollection } from "../index.js";
import type { DirectusUser } from "./user.js";

export interface DirectusActivity<Schema extends object> {
	id: number;
	action: string;
	user: DirectusUser<Schema> | string;
	timestamp: string;
	ip: string;
	user_agent: string;
	collection: string;
	item: string;
	comment: string | null;
	origin: string | null;
	revisions: number[];
}

export type DirectusActivityType<Schema extends object> = CoreCollection<Schema, 'directus_activity', DirectusActivity<Schema>>;
