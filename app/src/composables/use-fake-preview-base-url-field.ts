import type { Field } from '@directus/types';
import { computed, type ComputedRef, type Ref } from 'vue';
import { useI18n } from 'vue-i18n';

/**
 * Synthetic `$preview_base_url` field for the Preview URL variable dropdown.
 */
export function useFakePreviewBaseUrlField(
	collection: Ref<string | null>,
	enabled: Ref<boolean>,
): { fakePreviewBaseUrlField: ComputedRef<Field | null> } {
	const { t } = useI18n();

	const fakePreviewBaseUrlField = computed<Field | null>(() => {
		if (!enabled.value || !collection.value) return null;

		return {
			collection: collection.value,
			field: '$preview_base_url',
			schema: null,
			name: t('fields.directus_settings.preview_base_url'),
			type: 'string',
			meta: {
				field: '$preview_base_url',
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

	return { fakePreviewBaseUrlField };
}
