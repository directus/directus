import { Knex } from 'knex';
import { SchemaOverview } from './schema';

export interface AuthDriverOptions {
	knex: Knex;
	schema: SchemaOverview;
}

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
	auth_data: string | Record<string, unknown> | null;
}

export type AuthData = Record<string, any> | null;

export interface Session {
	token: string;
	expires: Date;
	data: string | null;
}

export type SessionData = Record<string, any> | null;
