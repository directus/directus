import { Field, FilterOperator } from '@/types';
import { TranslateResult } from 'vue-i18n';

export type FormField = DeepPartial<Field> & {
	field: string;
	name: string | TranslateResult;
	hideLabel?: boolean;
	hideLoader?: boolean;
};

export type ValidationError = {
	code: string;
	field: string;
	type: FilterOperator;
	valid?: number | string | (number | string)[];
	invalid?: number | string | (number | string)[];
	substring?: string;
};
