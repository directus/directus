import { Field } from '@/stores/fields/types';
import { TranslateResult } from 'vue-i18n';

export type FormField = Partial<Field> & {
	field: string;
	name: string | TranslateResult;
	hideLabel?: boolean;
};
