export interface User {
	id: string;
	first_name: string | null;
	last_name: string | null;
	email: string | null;
	password: string | null;
	status: 'active' | 'suspended' | 'invited';
	role: string | null;
	provider: string;
	external_identifier: string | null;
}

export type SessionData = Record<string, any> | null;

export interface Session {
	token: string;
	expires: Date;
	data: SessionData;
}
