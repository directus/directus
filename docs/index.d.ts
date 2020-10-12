export type File = {
	type: 'file';
	size: number;
	path: string;
	name: string;
	extension: string;
};

export type Directory = {
	type: 'directory';
	size: number;
	path: string;
	name: string;
	children: (Directory | File)[];
};

export type Link = {
	name: string;
	to: string;
};

export type Group = {
	name: string;
	to: string;
	children: (Group | Link | Divider)[];
	icon?: string;
};

export type Divider = {
	divider: true;
};

export const files: Directory;

export const nav: {
	app: (Group | Link | Divider)[];
	web: (Group | Link | Divider)[];
};
