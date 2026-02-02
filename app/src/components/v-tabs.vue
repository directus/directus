<script setup lang="ts">
import { useGroupableParent } from '@directus/composables';
import { provide, ref, toRefs } from 'vue';
import VList from '@/components/v-list.vue';

interface Props {
	/** Display the tabs in a vertical format */
	vertical?: boolean;
	/** The currently selected tab */
	modelValue?: (number | string)[];
}

const props = withDefaults(defineProps<Props>(), {
	vertical: false,
	modelValue: undefined,
});

const emit = defineEmits(['update:modelValue']);

const { modelValue: selection, vertical } = toRefs(props);

provide('v-tabs-vertical', vertical);

useGroupableParent(
	{
		selection: selection,
		onSelectionChange: update,
	},
	{
		multiple: ref(false),
		mandatory: ref(true),
	},
	'v-tabs',
);

function update(newSelection: readonly (string | number)[]) {
	emit('update:modelValue', newSelection);
}
</script>

<template>
	<VList v-if="vertical" class="v-tabs vertical alt-colors" nav>
		<slot />
	</VList>
	<div v-else class="v-tabs horizontal">
		<slot />
	</div>
</template>

<style scoped>
.v-tabs.horizontal {
	position: relative;
	display: inline-flex;
}

.v-tabs.horizontal :slotted(.v-tab) {
	display: flex;
	flex: 1 0 0;
	align-items: center;
	justify-content: center;
	block-size: 38px;
	padding: 8px 20px;
	cursor: pointer;
}
</style>
