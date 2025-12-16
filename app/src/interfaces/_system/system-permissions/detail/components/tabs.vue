<script setup lang="ts">
import { computed } from 'vue';
import VTab from '@/components/v-tab.vue';
import VTabs from '@/components/v-tabs.vue';

type Tab = {
	value: string;
	text: string;
	hasValue: boolean;
};

const props = defineProps<{
	tabs: Tab[];
	currentTab?: string;
}>();

const emit = defineEmits<{
	'update:currentTab': [value: string | undefined];
}>();

const internalCurrentTab = computed({
	get() {
		return props.currentTab ? [props.currentTab] : [];
	},
	set(value: string[]) {
		emit('update:currentTab', value[0]);
	},
});
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
	inline-size: 12px;
	block-size: 12px;
	background-color: var(--theme--foreground-subdued);
	border-radius: 50%;

	&.on {
		background-color: var(--theme--primary);
	}
}
</style>
