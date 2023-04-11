import { DeepPartial, Field } from '@directus/types';

export type FormField = DeepPartial<Field> & {
	field: string;
	name: string;
	hideLabel?: boolean;
	hideLoader?: boolean;
};
