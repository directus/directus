export type Role = {
	id: string;
	name: string;
	description: string;
	icon: string;
	enforce_tfa: null | boolean;
	external_id: null | string;
	ip_whitelist: string[];
	app_access: boolean;
	admin_access: boolean;
};

export type Avatar = {
	id: string;
};

// There's more data returned in thumbnails and the avatar data, but we
// only care about the thumbnails in this context

export type User = {
	id: string;
	status: string;
	first_name: string;
	last_name: string;
	email: string;
	token: string;
	last_login: string;
	last_page: string;
	external_id: string;
	tfa_secret: string;
	theme: 'auto' | 'dark' | 'light';
	role: Role;
	password_reset_token: string | null;
	timezone: string;
	language: string | null;
	avatar: null | Avatar;
	company: string | null;
	title: string | null;
	email_notifications: boolean;
};
