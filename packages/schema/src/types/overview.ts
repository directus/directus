export type SchemaOverview = {
	[table: string]: {
		primary: string;
		columns: {
			[column: string]: {
				table_name: string;
				column_name: string;
				default_value: string | null;
				is_nullable: boolean;
				is_generated: boolean;
				data_type: string;
				numeric_precision?: number | null;
				numeric_scale?: number | null;
				max_length: number | null;
			};
		};
	};
};
