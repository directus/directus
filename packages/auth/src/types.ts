export interface User {
	id?: string;
	first_name?: string;
	last_name?: string;
	email?: string;
	password?: string;
	status?: 'active' | 'suspended' | 'invited';
	role?: string;
	provider?: string;
	identifier?: string;
	auth_data?: string;
}

export interface AuthProviderConfig {
	driver: string;
	config: any;
}

export interface AuthManagerProviderConfig {
	[key: string]: AuthProviderConfig;
}

export interface AuthManagerConfig {
	default?: string;
	providers?: AuthManagerProviderConfig;
}
