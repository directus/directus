import { User } from '@directus/shared/types';

export type Activity = {
	id: number;
	action: 'comment';
	user: null | Partial<User>;
	timestamp: string;
	edited_on: null | string;
	comment: null | string;
};

export type ActivityByDate = {
	date: Date;
	dateFormatted: string;
	activity: Activity[];
};
