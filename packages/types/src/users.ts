import type { Policy } from './policies.js';

export type Role = {
	id: string;
	name: string;
	description: string;
	icon: string;
	users: string[];
	parent: string | null;
};

export type Avatar = {
	id: string;
	modified_on?: Date;
};

export type User = {
	id: string;
	status: 'draft' | 'invited' | 'unverified' | 'active' | 'suspended' | 'archived';
	first_name: string | null;
	last_name: string | null;
	email: string | null;
	password: string | null;
	token: string | null;
	last_access: string | null;
	last_page: string | null;
	external_identifier: string | null;
	tfa_secret: string | null;
	auth_data: Record<string, any> | null;
	provider: string;
	appearance: 'auto' | 'dark' | 'light' | null;
	theme_light: string | null;
	theme_dark: string | null;
	theme_light_overrides: Record<string, unknown> | null;
	theme_dark_overrides: Record<string, unknown> | null;
	role: Role | null;
	policies: Policy[];
	language: string | null;
	text_direction: 'ltr' | 'rtl' | 'auto';
	avatar: Avatar | null;
	title: string | null;
	description: string | null;
	location: string | null;
	tags: string[] | null;
	email_notifications: boolean;
};

export type RegisterUserInput = {
	email: NonNullable<User['email']>;
	password: NonNullable<User['password']>;
	verification_url?: string | null;
	first_name?: User['first_name'];
	last_name?: User['last_name'];
};

export enum UserIntegrityCheckFlag {
	None = 0,
	/** Check if the number of remaining admin users is greater than 0 */
	RemainingAdmins = 1 << 0,
	/** Check if the number of users is within the limits */
	UserLimits = 1 << 1,
	All = ~(~0 << 2),
}
