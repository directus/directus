export type LayoutOptions = {
	size?: number;
	icon?: string;
	imageSource?: string;
	title?: string;
	subtitle?: string;
	imageFit?: 'crop' | 'contain';
};

export type LayoutQuery = {
	fields: string[];
	sort: string[];
	limit: number;
	page: number;
};
