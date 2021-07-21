export interface User {
	id: string;
	first_name: string | null;
	last_name: string | null;
	email: string | null;
	password: string | null;
	status: 'active' | 'suspended';
	role: string | null;
	provider: string;
	provider_key: string | null;
	provider_data: string | null;
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
