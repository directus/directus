<template>
	<v-tabs vertical v-model="_currentTab">
		<v-tab v-for="tab in tabs" :key="tab.value" :value="tab.value" :disabled="tabEnabled(tab) === false">
			{{ tab.text }}
		</v-tab>
	</v-tabs>
</template>

<script lang="ts">
import { defineComponent, PropType, toRefs, computed } from '@vue/composition-api';
import useSync from '@/composables/use-sync';
import { LocalType, Tab } from './types';
import useValidation from './use-validation';
import { Field } from '@/stores/fields/types';

export default defineComponent({
	props: {
		tabs: {
			type: Array as PropType<Tab[]>,
			required: true,
		},
		currentTab: {
			type: Array as PropType<string[]>,
			default: null,
		},
		field: {
			type: Object as PropType<Field>,
			required: true,
		},
		localType: {
			type: String as PropType<LocalType>,
			default: null,
		},
		isNew: {
			type: Boolean,
			required: true,
		},
	},
	setup(props, { emit }) {
		const _currentTab = useSync(props, 'currentTab', emit);

		const { field, localType } = toRefs(props);
		const { fieldComplete, relationComplete, interfaceComplete, displayComplete } = useValidation(field, localType);

		const hasRelationshipTab = computed(() => {
			const relationshipTab = props.tabs.find((tab) => tab.value === 'relationship');

			return relationshipTab !== undefined;
		});

		return { _currentTab, fieldComplete, tabEnabled };

		function tabEnabled(tab: Tab) {
			if (props.isNew === false) return true;

			switch (tab.value) {
				case 'field':
					return true;
				case 'relationship':
					return fieldComplete.value === true;
				case 'interface':
					return hasRelationshipTab.value ? relationComplete.value === true : fieldComplete.value === true;
				case 'display':
					return interfaceComplete.value === true;
				case 'advanced':
					return displayComplete.value === true;
				default:
					return true;
			}
		}
	},
});
</script>
