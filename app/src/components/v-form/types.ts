import { Field } from '@/types';
import { TranslateResult } from 'vue-i18n';

export type FormField = DeepPartial<Field> & {
	field: string;
	name: string | TranslateResult;
	hideLabel?: boolean;
	hideLoader?: boolean;
};
