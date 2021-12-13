import { Permission } from '.';

export type Accountability = {
	role: string | null;
	user?: string | null;
	admin?: boolean;
	app?: boolean;
	permissions?: Permission[];
	share_scope?: {
		collection: string;
		item: string;
	};

	ip?: string;
	userAgent?: string;
};
