import { FormField } from '@/components/v-form/types';
import { useExtension } from '@/composables/use-extension';
import { getDefaultInterfaceForType } from '@/utils/get-default-interface-for-type';
import { translate } from '@/utils/translate-object-values';
import { Field } from '@directus/types';
import { cloneDeep } from 'lodash';
import { ComputedRef, Ref, computed } from 'vue';

export function getFormFields(fields: Ref<Field[]>): ComputedRef<Field[]> {
	return computed(() => {
		const formFields = [];

		for (let field of cloneDeep(fields.value)) {
			const systemFake = field.field?.startsWith('$');
			if (systemFake) continue;

			field = translate(field);

			if (!field.meta) {
				formFields.push(field);
				continue;
			}

			let interfaceUsed = field.meta.interface ? useExtension('interface', field.meta.interface).value : null;

			if (interfaceUsed === null) {
				field.meta.interface = getDefaultInterfaceForType(field.type);
				interfaceUsed = useExtension('interface', field.meta.interface).value;
			}

			if (interfaceUsed?.hideLabel === true) {
				(field as FormField).hideLabel = true;
			}

			if (interfaceUsed?.hideLoader === true) {
				(field as FormField).hideLoader = true;
			}

			formFields.push(field);
		}

		return formFields;
	});
}
