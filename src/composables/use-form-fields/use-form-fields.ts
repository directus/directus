/* eslint-disable @typescript-eslint/no-non-null-assertion */

import { computed, Ref } from '@vue/composition-api';
import { isEmpty } from '@/utils/is-empty';
import getDefaultInterfaceForType from '@/utils/get-default-interface-for-type';
import interfaces from '@/interfaces';
import { FormField } from '@/components/v-form/types';
import { Field } from '@/stores/fields/types';

export default function useFormFields(fields: Ref<Field[]>) {
	const formFields = computed(() => {
		let formFields = [...fields.value];

		/**
		 * @TODO
		 *
		 * This can be optimized by combining a bunch of these maps and filters
		 */
		// Filter out the fields that are marked hidden on detail
		formFields = formFields.filter((field) => {
			const hiddenDetail = field.system?.hidden_detail;
			if (isEmpty(hiddenDetail)) return true;
			return hiddenDetail === false;
		});

		// Sort the fields on the sort column value
		formFields = formFields.sort((a, b) => {
			if (a.system!.sort == b.system!.sort) return 0;
			if (a.system!.sort === null || a.system!.sort === undefined) return 1;
			if (b.system!.sort === null || b.system!.sort === undefined) return -1;
			return a.system!.sort > b.system!.sort ? 1 : -1;
		});

		// Make sure all form fields have a width associated with it
		formFields = formFields.map((field) => {
			if (!field.system!.width) {
				field.system!.width = 'full';
			}

			return field;
		});

		formFields = formFields.map((field) => {
			const interfaceUsed = interfaces.find((int) => int.id === field.system!.interface);
			const interfaceExists = interfaceUsed !== undefined;

			if (interfaceExists === false) {
				field.system!.interface = getDefaultInterfaceForType(field.system!.type);
			}

			if (interfaceUsed?.hideLabel === true) {
				(field as FormField).hideLabel = true;
			}

			if (interfaceUsed?.hideLoader === true) {
				(field as FormField).hideLoader = true;
			}

			return field;
		});

		// Change the class to half-right if the current element is preceded by another half width field
		// this makes them align side by side
		formFields = formFields.map((field, index, formFields) => {
			if (index === 0) return field;

			if (field.system!.width === 'half') {
				const prevField = formFields[index - 1];

				if (prevField.system!.width === 'half') {
					field.system!.width = 'half-right';
				}
			}

			return field;
		});

		return formFields;
	});

	return { formFields };
}
