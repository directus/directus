import type { Field } from '@directus/types';
import { computed, ref, unref, type Ref, type ComputedRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { useVersions } from './use-versions';

export function useFakeVersionField(
	collection: Ref<string | null>,
	injectVersionField: Ref<boolean>,
	versioningEnabled: Ref<boolean>,
): { fakeVersionField: ComputedRef<Field | null> } {
	const { t } = useI18n();
	const isSingleton = ref(false);
	const primaryKey = ref<string | null>(null);

	// Only create a safe collection ref when we have a non-null collection
	const safeCollection = computed(() => {
		const value = unref(collection);
		return value || null;
	});

	// Only get versions when we have a valid collection
	const { versions } = useVersions(
		safeCollection as Ref<string>, // Type assertion since useVersions expects non-null
		isSingleton,
		primaryKey,
	);

	const fakeVersionField = computed<Field | null>(() => {
		const collectionValue = unref(collection);
		if (!injectVersionField.value || !versioningEnabled.value || !collectionValue) return null;

		const choices =
			versions.value?.map((version) => ({
				text: version.name || version.key,
				value: version.key,
			})) ?? [];

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
