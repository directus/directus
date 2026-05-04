import type { License as Token } from '@directus/license';

type Addon = {
	name: string;
};

export type License = {
	type: string;
	key: string;
	token: Token;
	activated: boolean;
	project_id: string;
	/** Available Addons */
	addons: Addon[];
};

export const licenses: License[] = [];
