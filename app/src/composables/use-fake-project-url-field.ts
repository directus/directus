import type { Field } from '@directus/types';
import { computed, type ComputedRef, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';

export function useFakeProjectUrlField(
	collection: Ref<string | null>,
	enabled: Ref<boolean>,
): { fakeProjectUrlField: ComputedRef<Field | null> } {
	const { t } = useI18n();

	const fakeProjectUrlField = computed<Field | null>(() => {
		if (!enabled.value || !collection.value) return null;

		return {
			collection: collection.value,
			field: '$project_url',
			schema: null,
			name: t('fields.directus_settings.project_url'),
			type: 'string',
			meta: {
				field: '$project_url',
				collection: collection.value,
				id: -1,
				conditions: null,
				display: null,
				display_options: null,
				group: null,
				hidden: false,
				interface: 'input',
				note: null,
				options: null,
				readonly: true,
				required: false,
				searchable: false,
				sort: null,
				special: null,
				translations: null,
				validation: null,
				validation_message: null,
				width: 'full',
			},
		};
	});

	return { fakeProjectUrlField };
}
