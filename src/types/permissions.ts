export type Operation =
	| 'create'
	| 'read'
	| 'update'
	| 'validate'
	| 'delete'
	| 'comment'
	| 'explain';

export type Permission = {
	id: number;
	role: string | null;
	collection: string;
	operation: Operation;
	permissions: Record<string, any>;
	limit: number | null;
	presets: Record<string, any> | null;
	fields: string | null;
};
