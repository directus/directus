export interface Policy {
	id: string;
	name: string;
	icon: string;
	description: string;
	enforce_tfa: null | boolean;
	ip_access: string[];
	app_access: boolean;
	admin_access: boolean;
}

export interface Globals {
	enforce_tfa: boolean;
	app_access: boolean;
	admin_access: boolean;
}
