<script setup lang="ts">
import { useSync } from '@directus/composables';

const props = defineProps<{
	tabs: [];
	currentTab?: [];
}>();

const emit = defineEmits(['update:currentTab']);

const internalCurrentTab = useSync(props, 'currentTab', emit);
</script>

<template>
	<v-tabs v-model="internalCurrentTab" vertical>
		<v-tab v-for="tab in tabs" :key="tab.value" :value="tab.value">
			<span class="text">{{ tab.text }}</span>
			<span class="dot" :class="{ on: tab.hasValue }" />
		</v-tab>
	</v-tabs>
</template>

<style lang="scss" scoped>
.text {
	flex-grow: 1;
}

.dot {
	width: 12px;
	height: 12px;
	background-color: var(--theme--foreground-subdued);
	border-radius: 50%;

	&.on {
		background-color: var(--theme--primary);
	}
}
</style>
