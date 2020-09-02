/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { computed, Ref } from '@vue/composition-api';
import getDefaultInterfaceForType from '@/utils/get-default-interface-for-type';
import { getInterfaces } from '@/interfaces';
import { FormField } from '@/components/v-form/types';
import { Field } from '@/types';
import { clone } from 'lodash';

export default function useFormFields(fields: Ref<Field[]>) {
	const interfaces = getInterfaces();

	const formFields = computed(() => {
		let formFields = clone(fields.value);

		// Sort the fields on the sort column value
		formFields = formFields.sort((a, b) => {
			const aSort = a.meta?.sort || null;
			const bSort = b.meta?.sort || null;

			if (aSort === bSort) return 0;
			if (aSort === null) return 1;
			if (bSort === null) return -1;
			return aSort < bSort ? -1 : 1;
		});

		formFields = formFields.map((field, index) => {
			if (!field.meta) return field;

			let interfaceUsed = interfaces.value.find((int) => int.id === field.meta.interface);
			const interfaceExists = interfaceUsed !== undefined;

			if (interfaceExists === false) {
				field.meta.interface = getDefaultInterfaceForType(field.type);
			}

			interfaceUsed = interfaces.value.find((int) => int.id === field.meta.interface);

			if (interfaceUsed?.hideLabel === true) {
				(field as FormField).hideLabel = true;
			}

			if (interfaceUsed?.hideLoader === true) {
				(field as FormField).hideLoader = true;
			}

			if (index !== 0 && field.meta!.width === 'half') {
				const prevField = formFields[index - 1];

				if (prevField.meta.width === 'half') {
					field.meta.width = 'half-right';
				}
			}

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
