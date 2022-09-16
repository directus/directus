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
		origin: string;
		timestamp: string;
		user:
			| string
			| {
					id: string;
					email: string;
					first_name: string;
					last_name: string;
			  };
	};
	timestampFormatted: string;
};

export type RevisionsByDate = {
	date: Date;
	dateFormatted: string;
	revisions: Revision[];
};
