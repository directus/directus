export type Accountability = {
	role: string | null;
	user?: string | null;
	organism?: string | null;
	admin?: boolean;
	app?: boolean;

	ip?: string;
	userAgent?: string;
	headers?: Record<string, unknown>;
};
