import { FormField } from '@/components/v-form/types';
import { getInterface } from '@/interfaces';
import { Field } from '@directus/shared/types';
import { getDefaultInterfaceForType } from '@/utils/get-default-interface-for-type';
import { clone, orderBy } from 'lodash';
import { computed, ComputedRef, Ref } from 'vue';
import { translate } from '@/utils/translate-object-values';

export default function useFormFields(fields: Ref<Field[]>): { formFields: ComputedRef<Field[]> } {
	const formFields = computed(() => {
		let formFields = clone(fields.value);

		formFields = formFields.map((field, index) => {
			if (!field.meta) return field;

			let interfaceUsed = getInterface(field.meta.interface);
			if (interfaceUsed === undefined) {
				field.meta.interface = getDefaultInterfaceForType(field.type);
				interfaceUsed = getInterface(field.meta.interface);
			}

			if (interfaceUsed?.hideLabel === true) {
				(field as FormField).hideLabel = true;
			}

			if (interfaceUsed?.hideLoader === true) {
				(field as FormField).hideLoader = true;
			}

			if (index !== 0 && field.meta!.width === 'half') {
				const prevField = formFields[index - 1];

				if (prevField.meta?.width === 'half') {
					field.meta.width = 'half-right';
				}
			}

			return field;
		});

		formFields = formFields.filter((field) => {
			const systemFake = field.field?.startsWith('$') || false;
			return systemFake === false;
		});

		formFields = orderBy(formFields, [(field) => !!field.meta?.system, 'meta.sort', 'meta.id'], ['desc', 'asc', 'asc']);

		formFields = translate(formFields);

		return formFields;
	});

	return { formFields };
}
