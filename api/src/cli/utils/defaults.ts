import type { Policy, Role, User } from '@directus/types';

export const defaultAdminRole: Partial<Role> = {
	name: 'Administrator',
	icon: 'verified',
	description: '$t:admin_description',
};

export const defaultAdminUser: Partial<User> = {
	status: 'active',
	first_name: 'Admin',
	last_name: 'User',
};

export const defaultAdminPolicy: Partial<Policy> = {
	name: 'Administrator',
	icon: 'verified',
	admin_access: true,
	app_access: true,
	description: '$t:admin_description',
};
