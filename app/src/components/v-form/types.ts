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
	revisionFields?: Set<string>;
	selectedFields: string[];
	onToggleField: (field: string) => void;
}
