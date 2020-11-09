export type SchemaOverview = {
	[table: string]: {
		primary: string;
		columns: {
			[column: string]: {
				column_default: any;
				is_nullable: boolean;
				data_type: string;
				numeric_precision: number | null;
				numeric_scale: number | null;
			};
		};
	};
};
