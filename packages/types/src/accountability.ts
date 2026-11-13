export type Accountability = {
	role: string | null;
	roles: string[];
	user: string | null;
	admin: boolean;
	app: boolean;
	ip: string | null;
	userAgent?: string;
	origin?: string;
	session?: string;
	oauth?: {
		client: string;
		scopes: string[];
		aud: string[];
	};
};
