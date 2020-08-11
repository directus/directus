import { Avatar } from '@/types';

export type Activity = {
	id: number;
	action: 'comment';
	action_by: null | {
		id: number;
		first_name: string;
		last_name: string;
		avatar: null | Avatar;
	};
	action_on: string;
	edited_on: null | string;
	comment: null | string;
};

export type ActivityByDate = {
	date: Date;
	dateFormatted: string;
	activity: Activity[];
};
