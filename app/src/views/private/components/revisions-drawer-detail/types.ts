export type Revision = {
	id: number;
	data: Record<string, any>;
	delta: Record<string, any>;
	collection: string;
	item: string | number;
	activity: {
		action: string;
		ip: string;
		user_agent: string;
		action_on: string;
		action_by:
			| number
			| {
					id: number;
					first_name: string;
					last_name: string;
			  };
	};
};

export type RevisionsByDate = {
	date: Date;
	dateFormatted: string;
	revisions: Revision[];
};
