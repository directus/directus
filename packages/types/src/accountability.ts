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
	ip: string | null;
	userAgent?: string;
	origin?: string;
	session?: string;
	/**
	 * When true, IP-based policy restrictions are ignored for this accountability context.
	 * Used for background operations (e.g. notification permission checks) where the user's
	 * IP is unknown but access should still be evaluated at the role level.
	 */
	bypassIpRestrictions?: boolean;
};
