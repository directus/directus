export type LayoutOptions = {
	dateField: string;
	timeField?: string;
	title: string;
	userField: string;
};

export type Day = {
	year: number;
	month: number;
	day: number;
	event_count: number;
};

export type Event = {
	id: string | number;
	title: string;
	time?: Date;
	item: any;
	user?: {
		id: string;
		first_name: string;
		last_name: string;
		image?: string;
		avatar?: {
			id: string;
			storage: string;
			filename_disk: string;
			type: string;
			modified_on: string;
		};
	};
};

export type LayoutQuery = {
	fields?: string[];
	sort?: string;
	limit?: number;
	page?: number;
};
