export type Role = {
	id: string;
	name: string;
	description: string;
	icon: string;
	enforce_tfa: null | boolean;
	external_id: null | string;
	ip_access: string[];
	app_access: boolean;
	admin_access: boolean;
	users: string[];
};

export type Avatar = {
	id: string;
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
	language: string | null;
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
