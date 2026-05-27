<script setup lang="ts">
import { useSync } from '@directus/composables';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useFieldDetailStore } from '../store';
import VTab from '@/components/v-tab.vue';
import VTabs from '@/components/v-tabs.vue';

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
			],
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
	<VTabs v-model="currentTabSync" vertical>
		<VTab v-for="tab in tabs" :key="tab.value" :value="tab.value">
			{{ tab.text }}
		</VTab>
	</VTabs>
</template>
