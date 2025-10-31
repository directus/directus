import { DeepPartial, Field, InterfaceConfig } from '@directus/types';

export type FormField = DeepPartial<Field> & {
	field: string;
	name: string;
} & Pick<InterfaceConfig, 'hideLabel' | 'hideLoader' | 'comparisonIndicator'>;

export interface ComparisonContext {
	side: 'base' | 'incoming';
	fields: Set<string>;
	revisionFields?: Set<string>;
	selectedFields: string[];
	onToggleField: (field: string) => void;
}
