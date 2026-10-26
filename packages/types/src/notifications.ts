import type { PrimaryKey } from './items.js';

export type Notification = {
	id: number;
	status: string | null;
	timestamp: string | null;
	recipient: string;
	sender: string | null;
	subject: string;
	message: string | null;
	collection: string | null;
	item: PrimaryKey | null;
};
