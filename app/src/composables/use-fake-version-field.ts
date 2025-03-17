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

		// TODO: fetch or pass choices when needed (see the other comment)
		const choices: { text: string; value: any }[] = [];

		return {
			collection: collectionValue,
			field: '$version',
			schema: null,
			name: t('version'),
			type: 'string',
			meta: {
				field: '$version',
				collection: collectionValue,
				id: -1,
				conditions: null,
				display: null,
				display_options: null,
				group: null,
				hidden: false,
				interface: 'select-dropdown',
				note: null,
				options: {
					allowOther: false,
					choices: [{ text: t('main_version'), value: null }, ...choices],
				},
				readonly: true,
				required: false,
				sort: null,
				special: null,
				translations: null,
				validation: null,
				validation_message: null,
				width: 'full',
			},
		};
	});

	return { fakeVersionField };
}
