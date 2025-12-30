import { useVersions } from './use-versions';
import type { Field } from '@directus/types';
import { computed, type ComputedRef, type Ref, ref } from 'vue';
import { useI18n } from 'vue-i18n';

type Choice = { text: string; value: string | null };

export function useFakeVersionField(
	collection: Ref<string | null>,
	versioningEnabled: Ref<boolean>,
	includeChoices = ref(false),
): { fakeVersionField: ComputedRef<Field | null> } {
	const { t } = useI18n();

	// If `includeChoices` is `true`, the versions will be fetched, because they are only fetched if the `isSingleton` parameter of `useVersions` is `true`.
	const { versions } = useVersions(collection as Ref<string>, includeChoices, ref(null));

	const fakeVersionField = computed<Field | null>(() => {
		if (!versioningEnabled.value || !collection.value) return null;

		const choices = getChoices();

		return {
			collection: collection.value,
			field: '$version',
			schema: null,
			name: t('version'),
			type: 'string',
			meta: {
				field: '$version',
				collection: collection.value,
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

	function getChoices(): Choice[] {
		if (!includeChoices.value || !versions.value?.length) return [];

		return versions.value
			?.map((version) => ({
				text: version.name || version.key,
				value: version.key,
			}))
			.filter(uniqueItems);

		function uniqueItems(version: Choice, index: number, self: Choice[]) {
			return index === self.findIndex((v) => v.text === version.text && v.value === version.value);
		}
	}
}
