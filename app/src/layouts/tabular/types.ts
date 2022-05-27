export type LayoutOptions = {
	widths?: {
		[field: string]: number;
	};
	align?: {
		[field: string]: 'left' | 'center' | 'right';
	};
	limit?: number;
	spacing?: 'comfortable' | 'cozy' | 'compact';
};

export type LayoutQuery = {
	fields: string[];
	sort: string[];
	page: number;
	limit: number;
};
