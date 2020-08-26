export type Permission = {
	id: number;
	role: string | null;
	collection: string;
	operation: 'create' | 'read' | 'update' | 'validate' | 'delete';
	permissions: Record<string, any> | null;
	presets: Record<string, any> | null;
	fields: string | null;
	limit: number | null;
};
