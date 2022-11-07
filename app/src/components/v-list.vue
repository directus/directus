<template>
	<ul class="v-list" :class="{ nav, dense }">
		<slot />
	</ul>
</template>

<script setup lang="ts">
import { toRefs } from 'vue';
import { useGroupableParent } from '@directus/shared/composables';

interface Props {
	/** Model what elements should be currently active */
	modelValue?: (string | number)[];
	/** If the item is inside the navigation */
	nav?: boolean;
	/** Renders the list densely */
	dense?: boolean;
	/** Allows to select multiple items in the list */
	multiple?: boolean;
	/** At least one item has to be selected */
	mandatory?: boolean;
	/** Items that do not have the same scope will be ignored */
	scope?: string;
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: undefined,
	nav: false,
	dense: false,
	multiple: true,
	mandatory: true,
	scope: 'v-list',
});

const emit = defineEmits(['update:modelValue', 'toggle']);

const { modelValue, multiple, mandatory } = toRefs(props);

useGroupableParent(
	{
		selection: modelValue,
		onSelectionChange: (newSelection) => {
			emit('update:modelValue', newSelection);
		},
		onToggle: (item) => {
			emit('toggle', item);
		},
	},
	{
		mandatory,
		multiple,
	},
	props.scope
);
</script>

<style scoped>
:global(body) {
	--v-list-padding: 4px 0;
	--v-list-border-radius: var(--border-radius);
	--v-list-max-height: none;
	--v-list-max-width: none;
	--v-list-min-width: 220px;
	--v-list-min-height: none;
	--v-list-color: var(--foreground-normal-alt);
	--v-list-color-hover: var(--foreground-normal-alt);
	--v-list-color-active: var(--foreground-normal-alt);
	--v-list-background-color-hover: var(--background-normal);
	--v-list-background-color-active: var(--background-normal);
}

.v-list {
	position: static;
	display: block;
	min-width: var(--v-list-min-width);
	max-width: var(--v-list-max-width);
	min-height: var(--v-list-min-height);
	max-height: var(--v-list-max-height);
	padding: var(--v-list-padding);
	overflow: auto;
	color: var(--v-list-color);
	line-height: 22px;
	list-style: none;
	border-radius: var(--v-list-border-radius);
}

.nav {
	--v-list-padding: 12px;
	--v-list-item-icon-color: var(--primary);
}

:slotted(.v-divider) {
	max-width: calc(100% - 16px);
	margin: 8px;
}
</style>
