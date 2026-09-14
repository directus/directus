export type Folder = {
	id: string;
	name: string;
	parent: string | null;
	type: 'files' | 'flows';
};
