export type ContentVersion = {
	id: string;
	key: string;
	name: string | null;
	collection: string;
	item: string | null;
	hash: string;
	date_created: string;
	date_updated: string | null;
	user_created: string | null;
	user_updated: string | null;
	delta: Record<string, any> | null;
};
