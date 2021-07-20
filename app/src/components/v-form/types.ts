import { Field } from '@/types';
import { DeepPartial } from '@directus/shared/types';

export type FormField = DeepPartial<Field> & {
	field: string;
	name: string;
	hideLabel?: boolean;
	hideLoader?: boolean;
};
