import { FormField } from '@/components/v-form/types';
import { getInterfaces } from '@/interfaces';
import { Field, InterfaceConfig } from '@directus/shared/types';
import { getDefaultInterfaceForType } from '@/utils/get-default-interface-for-type';
import { clone, orderBy } from 'lodash';
import { computed, ComputedRef, Ref } from 'vue';
import { translate } from '@/utils/translate-object-values';

export default function useFormFields(fields: Ref<Field[]>): { formFields: ComputedRef<Field[]> } {
	const { interfaces } = getInterfaces();

	const systemFieldsCount = computed(() => fields.value.filter((field) => field.meta?.system === true).length);

	const formFields = computed(() => {
		let formFields = clone(fields.value);

		formFields = formFields.map((field, index) => {
			if (!field.meta) return field;

			let interfaceUsed = interfaces.value.find((int: InterfaceConfig) => int.id === field.meta?.interface);
			const interfaceExists = interfaceUsed !== undefined;

			if (interfaceExists === false) {
				field.meta.interface = getDefaultInterfaceForType(field.type);
			}

			interfaceUsed = interfaces.value.find((int: InterfaceConfig) => int.id === field.meta?.interface);

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

			if (field.meta?.sort && field.meta?.system !== true) {
				field.meta.sort = Number(field.meta.sort) + Number(systemFieldsCount.value);
			}

			return field;
		});

		formFields = formFields.filter((field) => {
			const systemFake = field.field?.startsWith('$') || false;
			return systemFake === false;
		});

		formFields = orderBy(formFields, ['meta.sort', 'meta.id']);

		formFields = translate(formFields);

		return formFields;
	});

	return { formFields };
}
