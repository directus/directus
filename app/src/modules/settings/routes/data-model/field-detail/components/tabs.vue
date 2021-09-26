<template>
	<v-tabs v-model="internalCurrentTab" vertical>
		<v-tab v-for="tab in tabs" :key="tab.value" :value="tab.value" :disabled="tab.disabled">
			{{ tab.text }}
		</v-tab>
	</v-tabs>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { useSync } from '@directus/shared/composables';

export default defineComponent({
	props: {
		tabs: {
			type: Array as PropType<string[]>,
			required: true,
		},
		current: {
			type: Array as PropType<string[]>,
			default: () => ['schema'],
		},
		type: {
			type: String,
			default: 'standard',
		},
	},
	emits: ['update:current'],
	setup(props, { emit }) {
		const internalCurrentTab = useSync(props, 'current', emit);

		return { internalCurrentTab };
	},
});
</script>
