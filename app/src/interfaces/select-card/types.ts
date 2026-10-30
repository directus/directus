export type Choice<T = string | number> = {
	text: string;
	value: T;
	description?: string;
	icon_type?: 'icon' | 'image';
	icon?: string;
	image?: string;
};
