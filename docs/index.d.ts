export type DocsFile = {
	name: string;
	path: string;
	import: () => Promise<{ default: string }>;
};

export type DocsFolder = {
	name: string;
	path: string;
	children: DocsRoutes;
};

export type DocsRoutes = (DocsFolder | DocsFile)[];

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

declare const docs: DocsRoutes;
export default docs;
