import { Avatar } from '@/types';

export type Activity = {
	id: number;
	action: 'comment';
	user: null | {
		id: number;
		first_name: string;
		last_name: string;
		avatar: null | Avatar;
	};
	timestamp: string;
	edited_on: null | string;
	comment: null | string;
};

export type ActivityByDate = {
	date: Date;
	dateFormatted: string;
	activity: Activity[];
};
