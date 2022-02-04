import { Permission } from '.';

export type Accountability = {
	role: string | null;
	user?: string | null;
	admin?: boolean;
	app?: boolean;
	permissions?: Permission[];

	ip?: string;
	userAgent?: string;
};
