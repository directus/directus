export type LayoutOptions = {
	widths?: {
		[field: string]: number;
	};
	limit?: number;
	spacing?: 'comfortable' | 'cozy' | 'compact';
};

export type LayoutQuery = {
	fields?: string[];
	sort?: string[];
	page?: number;
	limit?: number;
};
