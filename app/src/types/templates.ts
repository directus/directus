import { ComputedRef } from '@vue/composition-api';

export type StringTemplate = {
	fieldsInTemplate: ComputedRef<string[]>;
	displayValue: ComputedRef<string | false>;
};
