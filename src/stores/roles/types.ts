export type Role = {
	id: number;
	name: string;
	description: string;
	collection_listing: null;
	module_listing: null;
	enforce_2fa: null | boolean;
	external_id: null | string;
	ip_whitelist: string[];
};
