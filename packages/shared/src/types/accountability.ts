export type Accountability = {
	role?: string | null;
	user?: string | null;
	user_role?: string | null;
	admin?: boolean;
	app?: boolean;

	ip?: string;
	userAgent?: string;

	maintenance?: boolean;
	maintenance_role?: string | null;
};
