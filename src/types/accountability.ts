export type Accountability = {
	role: string;
	user?: string;
	admin?: boolean;

	ip?: string;
	userAgent?: string;

	parent?: number;
};
