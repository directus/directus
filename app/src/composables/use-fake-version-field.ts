import type { Field } from '@directus/types';
import { computed, ref, unref, type Ref, type ComputedRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { useVersions } from './use-versions';

type Choice = { text: string; value: string | null };

export function useFakeVersionField(
	collection: Ref<string | null>,
	injectVersionField: Ref<boolean>,
	versioningEnabled: Ref<boolean>,
	includeChoices = false,
): { fakeVersionField: ComputedRef<Field | null> } {
	const { t } = useI18n();
	const isSingleton = ref(false);
	const primaryKey = ref<string | null>(null);
	let choices = computed<Choice[]>(() => []);

	if (collection.value && includeChoices) {
		const { versions } = useVersions(collection as Ref<string>, isSingleton, primaryKey);

		choices = computed(() => {
			if (!versions.value?.length) return [];

			return versions.value
				?.map((version) => ({
					text: version.name || version.key,
					value: version.key,
				}))
				.filter(uniqueItems);

			function uniqueItems(version: Choice, index: number, self: Choice[]) {
				return index === self.findIndex((v) => v.text === version.text && v.value === version.value);
			}
		});
	}

	const fakeVersionField = computed<Field | null>(() => {
		const collectionValue = unref(collection);
		if (!injectVersionField.value || !versioningEnabled.value || !collectionValue) return null;

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
					choices: [{ text: t('main_version'), value: null }, ...choices.value],
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
