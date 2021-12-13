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
	app_access: boolean;
	admin_access: boolean;
}

export type AuthData = Record<string, any> | null;

export interface Session {
	token: string;
	expires: Date;
	data: string | Record<string, unknown> | null;
	share: string;
}

export type SessionData = Record<string, any> | null;

export type DirectusTokenPayload = {
	id?: string;
	role: string | null;
	app_access: boolean | number;
	admin_access: boolean | number;
	share_scope?: {
		collection: string;
		item: string;
	};
};

export type ShareData = {
	shared_id: string;
	shared_role: string;
	shared_item: string;
	shared_collection: string;
	shared_expires: Date;
	shared_times_used: number;
	shared_max_uses?: number;
};
