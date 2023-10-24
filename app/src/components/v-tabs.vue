<script setup lang="ts">
import { toRefs, provide, ref } from 'vue';
import { useGroupableParent } from '@directus/composables';

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
	'v-tabs'
);

function update(newSelection: readonly (string | number)[]) {
	emit('update:modelValue', newSelection);
}
</script>

<template>
	<v-list v-if="vertical" class="v-tabs vertical alt-colors" nav>
		<slot />
	</v-list>
	<div v-else class="v-tabs horizontal">
		<slot />
	</div>
</template>

<style scoped>
:global(body) {
	--v-tabs-underline-color: var(--theme--foreground);
}

.v-tabs.horizontal {
	position: relative;
	display: inline-flex;
}

.v-tabs.horizontal :slotted(.v-tab) {
	display: flex;
	flex-basis: 0px;
	flex-grow: 1;
	flex-shrink: 0;
	align-items: center;
	justify-content: center;
	height: 38px;
	padding: 8px 20px;
	cursor: pointer;
}
</style>
