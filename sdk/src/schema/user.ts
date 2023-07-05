import type { DirectusFile } from "./file.js";

// Base type for directus_users
export interface DirectusUser {
	id: string; // uuid
	first_name: string | null;
	last_name: string | null;
	email: string | null;
	password: string | null; // will just be *s
	location: string | null;
	title: string | null;
	description: string | null;
	tags: string[];
	avatar: DirectusFile | string;
	language: string | null;
	theme: string;
	tfa_secret: string | null;
	status: string;
	role: string;
	token: string | null;
	last_access: string | null;
	last_page: string | null;
	provider: string;
	external_identifier: string;
	auth_data: Record<string, any> | null;
	email_notifications: boolean;
}