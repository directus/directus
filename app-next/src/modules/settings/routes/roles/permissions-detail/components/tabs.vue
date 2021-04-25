<template>
	<v-tabs vertical v-model="_currentTab">
		<v-tab v-for="tab in tabs" :key="tab.value" :value="tab.value">
			<span class="text">{{ tab.text }}</span>
			<span class="dot" :class="{ on: tab.hasValue }" />
		</v-tab>
	</v-tabs>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';
import useSync from '@/composables/use-sync';

export default defineComponent({
	props: {
		currentTab: {
			type: Array,
			default: null,
		},
		tabs: {
			type: Array,
			required: true,
		},
	},
	setup(props, { emit }) {
		const _currentTab = useSync(props, 'currentTab', emit);

		return { _currentTab };
	},
});
</script>

<style lang="scss" scoped>
.text {
	flex-grow: 1;
}

.dot {
	width: 12px;
	height: 12px;
	background-color: var(--foreground-subdued);
	border-radius: 50%;

	&.on {
		background-color: var(--primary);
	}
}
</style>
