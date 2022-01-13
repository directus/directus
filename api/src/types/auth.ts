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
	share?: string;
	share_scope?: {
		collection: string;
		item: string;
	};
};

export type ShareData = {
	share_id: string;
	share_role: string;
	share_item: string;
	share_collection: string;
	share_start: Date;
	share_end: Date;
	share_times_used: number;
	share_max_uses?: number;
	share_password?: string;
};

export type LoginResult = {
	accessToken: any;
	refreshToken: any;
	expires: any;
	id?: any;
};
