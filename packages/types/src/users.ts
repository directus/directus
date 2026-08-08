import type { Policy } from './policies.js';

export type Role = {
	id: string;
	name: string;
	description: string | null;
	icon: string;
	parent: string | Role | null;
	children?: Role[];
	policies?: Policy[];
	users?: User[];
};

export type User = {
	id: string;
	status: 'draft' | 'invited' | 'unverified' | 'active' | 'suspended' | 'archived' | 'inactive-license';
	first_name: string | null;
	last_name: string | null;
	email: string | null;
	password: string | null;
	token: string | null;
	timezone: string | null;
	locale: string | null;
	avatar: string | null;
	company: string | null;
	title: string | null;
	description: string | null;
	location: string | null;
	email_notifications: boolean | null;
	theme: string | null;
	tfa_secret: string | null;
	role: Role | null;
};
