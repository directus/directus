import { computed, Ref } from '@vue/composition-api';
import { notEmpty } from '@/utils/is-empty';
import { LocalType } from './types';
import { Field } from '@/stores/fields/types';

export default function useValidation(field: Ref<Field>, localType: Ref<LocalType>) {
	const fieldComplete = computed<boolean>(() => {
		return notEmpty(field.value.field) && notEmpty(localType.value);
	});

	const relationComplete = computed<boolean>(() => {
		return true;
	});

	const interfaceComplete = computed<boolean>(() => {
		return notEmpty(field.value.interface);
	});

	const displayComplete = computed<boolean>(() => {
		return notEmpty(field.value.display);
	});

	const schemaComplete = computed<boolean>(() => {
		return true;
	});

	return {
		fieldComplete,
		relationComplete,
		interfaceComplete,
		displayComplete,
		schemaComplete,
	};
}
