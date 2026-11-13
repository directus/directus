import { Role, User } from '@directus/types';

export type AppUser = User & {
	admin_access: boolean;
	app_access: boolean;
	enforce_tfa: boolean;
	roles: Role[];
};
