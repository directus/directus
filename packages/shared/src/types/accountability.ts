import { Permission } from './permissions';

export type ShareScope = {
	collection: string;
	item: string;
};

export type Accountability = {
	role: string | null;
	user?: string | null;
	admin?: boolean;
	app?: boolean;
	permissions?: Permission[];
	share?: string;
	share_scope?: ShareScope;

	ip?: string;
	userAgent?: string;
	origin?: string;
};
