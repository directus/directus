export type ShareScope = {
	collection: string;
	item: string;
};

export type Accountability = {
	role: string | null;
	roles: string[];
	user: string | null;
	admin: boolean;
	app: boolean;
	share?: string;
	share_scope?: ShareScope;
	ip: string | null;
	userAgent?: string;
	origin?: string;
};
