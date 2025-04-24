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
	share?: string | undefined;
	ip: string | null;
	userAgent?: string | undefined;
	origin?: string | undefined;
	session?: string | undefined;
};
