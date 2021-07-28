export interface User {
	id: string;
	first_name: string | null;
	last_name: string | null;
	email: string | null;
	password: string | null;
	status: 'active' | 'suspended' | 'invited';
	role: string | null;
	provider: string;
	identifier: string | null;
	auth_data: string | null;
}

export interface AuthProviderConfig {
	driver: string;
	config: any;
}

export interface AuthManagerConfig {
	default?: string;
	providers?: Record<string, AuthProviderConfig>;
}
