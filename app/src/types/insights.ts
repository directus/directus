import { Panel } from '@directus/shared/types';

export type Dashboard = {
	id: string;
	name: string;
	note: string;
	icon: string;
	panels: Panel[];
	date_created: string;
	user_created: string;
};
