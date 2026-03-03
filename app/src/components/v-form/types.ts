import { DeepPartial, Field, InterfaceConfig } from '@directus/types';

export type FormField = Omit<DeepPartial<Field>, 'meta'> & {
	field: string;
	name: string;
	meta?: DeepPartial<Field['meta']> & {
		non_editable?: boolean;
	};
} & Pick<InterfaceConfig, 'hideLabel' | 'hideLoader' | 'indicatorStyle'>;

export interface ComparisonContext {
	side: 'base' | 'incoming';
	fields: Set<string>;
	revisionFields?: Set<string>;
	selectedFields: string[];
	onToggleField: ((field: string) => void) | null;
}

export type FieldValues = {
	[field: string]: any;
};
