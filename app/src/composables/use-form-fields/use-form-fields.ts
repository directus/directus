/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { FormField } from '@/components/v-form/types';
import { getInterfaces } from '@/interfaces';
import { InterfaceConfig } from '@/interfaces/types';
import { Field } from '@/types';
import getDefaultInterfaceForType from '@/utils/get-default-interface-for-type';
import { computed, ComputedRef, Ref } from '@vue/composition-api';
import { clone } from 'lodash';

export default function useFormFields(fields: Ref<Field[]>): { formFields: ComputedRef } {
	const { interfaces } = getInterfaces();

	const formFields = computed(() => {
		let formFields = clone(fields.value);
		let parseTab = -1;

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

			if (field.meta?.interface == 'tab') parseTab = field.meta.id;
			else field.meta.group = parseTab;

			return field;
		});

		// Filter out the fields that are marked hidden on detail
		formFields = formFields.filter((field) => {
			const hidden = field.meta?.hidden;
			const systemFake = field.field?.startsWith('$') || false;
			return hidden !== true && systemFake === false;
		});

		return formFields;
	});

	return { formFields };
}
