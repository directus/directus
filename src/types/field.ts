export type FieldInfo = {
	id: number;
	collection: string;
	field: string;
	special: string | null;
	interface: string | null;
	options: Record<string, any> | null;
	locked: boolean;
	required: boolean;
	readonly: boolean;
	hidden_detail: boolean;
	hidden_browse: boolean;
	sort: number | null;
	width: string | null;
	group: number | null;
	note: string | null;
	translation: null;
};
