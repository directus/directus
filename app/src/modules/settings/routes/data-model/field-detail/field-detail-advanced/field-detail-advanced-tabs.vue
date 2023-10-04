<script setup lang="ts">
import { useSync } from '@directus/composables';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useFieldDetailStore } from '../store';

const props = defineProps<{
	currentTab: string[];
}>();

const emit = defineEmits(['update:currentTab']);

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
		text: t('validation'),
		value: 'validation',
	});

	tabs.push({
		text: t('conditions'),
		value: 'conditions',
	});

	return tabs;
});
</script>

<template>
	<v-tabs v-model="currentTabSync" vertical>
		<v-tab v-for="tab in tabs" :key="tab.value" :value="tab.value" :disabled="tab.disabled">
			{{ tab.text }}
		</v-tab>
	</v-tabs>
</template>
