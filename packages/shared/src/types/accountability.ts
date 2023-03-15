import { Permission } from './permissions';
import { User } from './users';

export type ShareScope = {
	collection: string;
	item: string;
};

export type Accountability = {
	role: string | null;
	user?: string | null;
	userDetail?: User;
	admin?: boolean;
	app?: boolean;
	permissions?: Permission[];
	share?: string;
	share_scope?: ShareScope;

	ip?: string;
	userAgent?: string;
	origin?: string;
};
