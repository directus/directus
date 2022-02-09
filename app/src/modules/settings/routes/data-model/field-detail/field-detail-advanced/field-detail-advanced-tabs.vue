<template>
	<v-tabs v-model="currentTabSync" vertical>
		<v-tab v-for="tab in tabs" :key="tab.value" :value="tab.value" :disabled="tab.disabled">
			{{ tab.text }}
		</v-tab>
	</v-tabs>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useSync } from '@directus/shared/composables';
import { useFieldDetailStore } from '../store';
import { storeToRefs } from 'pinia';

export default defineComponent({
	props: {
		currentTab: {
			type: Array as PropType<string[]>,
			required: true,
		},
	},
	emits: ['update:currentTab'],
	setup(props, { emit }) {
		const fieldDetail = useFieldDetailStore();

		const { localType } = storeToRefs(fieldDetail);

		const currentTabSync = useSync(props, 'currentTab', emit);

		const { t } = useI18n();

		const tabs = computed(() => {
			const tabs = [
				{
					text: t('schema'),
					value: 'schema',
				},
				{
					text: t('field', 1),
					value: 'field',
				},
				{
					text: t('interface_label'),
					value: 'interface',
				},
			];

			if (localType.value !== 'presentation' && localType.value !== 'group') {
				tabs.push({
					text: t('display'),
					value: 'display',
				});
			}

			if (['o2m', 'm2o', 'm2m', 'm2a', 'files', 'file'].includes(localType.value)) {
				tabs.splice(1, 0, {
					text: t('relationship'),
					value: 'relationship',
				});
			}

			if (localType.value === 'translations') {
				tabs.splice(
					1,
					0,
					...[
						{
							text: t('translations'),
							value: 'relationship',
						},
					]
				);
			}

			tabs.push({
				text: t('conditions'),
				value: 'conditions',
			});

			return tabs;
		});

		return { tabs, currentTabSync };
	},
});
</script>
