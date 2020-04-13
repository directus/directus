export type Permission = {
	id: number;
	collection: string;
	role: number;
	status: string | null;
	create: 'full' | 'none';
	read: 'none' | 'mine' | 'role' | 'full';
	update: 'none' | 'mine' | 'role' | 'full';
	delete: 'none' | 'mine' | 'role' | 'full';
	comment: 'none' | 'read' | 'create' | 'update' | 'full';
	explain: 'none' | 'create' | 'update' | 'always';
	read_field_blacklist: string[];
	write_field_blacklist: string[];
	status_blacklist: string[];
};
