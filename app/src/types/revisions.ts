export type Revision = {
	data: Record<string, any> | null;
	delta: Record<string, any> | null;
} & RevisionWithTime;

export type RevisionPartial = {
	id: number;
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
};

export type RevisionWithTime = RevisionPartial & {
	timestampFormatted: string;
	timeRelative: string;
	status: 'resolve' | 'reject';
};

export type RevisionsByDate = {
	date: Date;
	dateFormatted: string;
	revisions: RevisionWithTime[];
};
