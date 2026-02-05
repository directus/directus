import { Field } from '@directus/types';
import { cloneDeep, orderBy } from 'lodash';
import { computed, ComputedRef, Ref } from 'vue';
import { FormField } from '@/components/v-form/types';
import { useExtension } from '@/composables/use-extension';
import { getDefaultInterfaceForType } from '@/utils/get-default-interface-for-type';
import { translate } from '@/utils/translate-object-values';

export function getFormFields(fields: Ref<Field[]>): ComputedRef<Field[]> {
	return computed(() => {
		const systemFields: Field[] = [];
		const userFields: Field[] = [];

		const clonedFields = cloneDeep(fields.value);

		const sortedFields = orderBy(clonedFields, ['meta.group', 'meta.sort', 'meta.id'], ['desc', 'asc', 'asc']);

		for (let field of sortedFields) {
			const systemFake = field.field?.startsWith('$');
			if (systemFake) continue;

			field = translate(field);

			if (!field.meta) {
				userFields.push(field);
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

			const indicatorStyleDefaultValue = field.meta?.special?.includes('group') ? 'hidden' : 'active';
			(field as FormField).indicatorStyle = interfaceUsed?.indicatorStyle ?? indicatorStyleDefaultValue;

			(field.meta.system ? systemFields : userFields).push(field);
		}

		return [
			...systemFields,
			...(systemFields.length > 0 && userFields.length > 0
				? [
						{
							field: '$system_divider',
							type: 'alias',
							meta: { interface: 'presentation-divider', group: null },
							hideLabel: true,
							hideLoader: true,
						} as unknown as Field,
					]
				: []),
			...userFields,
		];
	});
}
