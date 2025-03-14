import type { Field } from '@directus/types';
import { computed, unref, type Ref, type ComputedRef } from 'vue';
import { useI18n } from 'vue-i18n';

export function useFakeVersionField(
	collection: Ref<string | null>,
	injectVersionField: Ref<boolean>,
	versioningEnabled: Ref<boolean>,
): { fakeVersionField: ComputedRef<Field | null> } {
	const { t } = useI18n();

	const fakeVersionField = computed<Field | null>(() => {
		const collectionValue = unref(collection);
		if (!injectVersionField.value || !versioningEnabled.value || !collectionValue) return null;

		return {
			collection: collectionValue,
			field: '$version',
			schema: null,
			name: t('version'),
			type: 'integer',
			meta: {
				id: -1,
				collection: collectionValue,
				field: '$version',
				sort: null,
				special: null,
				interface: null,
				options: null,
				display: null,
				display_options: null,
				hidden: false,
				translations: null,
				readonly: true,
				width: 'full',
				group: null,
				note: null,
				required: false,
				conditions: null,
				validation: null,
				validation_message: null,
			},
		};
	});

	return { fakeVersionField };
}
