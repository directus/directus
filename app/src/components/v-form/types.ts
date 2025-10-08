import { DeepPartial, Field } from '@directus/types';

export type FormField = DeepPartial<Field> & {
	field: string;
	name: string;
	hideLabel?: boolean;
	hideLoader?: boolean;
};

export interface ComparisonContext {
	side: 'base' | 'incoming';
	fields: Set<string>;
	selectedFields: string[];
	onToggleField: (field: string) => void;
	comparisonType?: 'version' | 'revision';
}
