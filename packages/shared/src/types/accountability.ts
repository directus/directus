export type Accountability = {
	role: string | null;
	user?: string | null;
	admin?: boolean;
	app?: boolean;

	ip?: string;
	userAgent?: string;
};
