export type Permission = {
	id: number;
	role: string | null;
	collection: string;
	action: 'create' | 'read' | 'update' | 'delete';
	permissions: Record<string, any> | null;
	validation: Record<string, any> | null;
	presets: Record<string, any> | null;
	fields: string[] | null;
	limit: number | null;
};
