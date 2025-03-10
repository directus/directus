import type { Field } from '@directus/types';
import { computed, unref, type Ref, type ComputedRef } from 'vue';
import { useI18n } from 'vue-i18n';

export function useVersionField(
	collection: Ref<string | null>,
	injectVersionField: boolean,
	versioningEnabled: boolean,
): { versionField: ComputedRef<Field | null> } {
	const { t } = useI18n();

	const versionField = computed<Field | null>(() => {
		const collectionValue = unref(collection);
		if (!injectVersionField || !versioningEnabled || !collectionValue) return null;

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

	return { versionField };
}
