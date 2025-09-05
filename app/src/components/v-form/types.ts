import { DeepPartial, Field } from '@directus/types';

export type FormField = DeepPartial<Field> & {
	field: string;
	name: string;
	hideLabel?: boolean;
	hideLoader?: boolean;
};

export interface ComparisonContext {
	mode: boolean;
	side?: 'main' | 'version';
	fields: Set<string>;
	selectedFields?: string[];
	onToggleField?: (field: string) => void;
}
