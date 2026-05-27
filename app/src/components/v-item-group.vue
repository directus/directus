<script setup lang="ts">
import { useGroupableParent } from '@directus/composables';
import { toRefs } from 'vue';

interface Props {
	/** If enabled, at least one item has to be selected */
	mandatory?: boolean;
	/** The maximum amount of items that can be selected */
	max?: number;
	/** If enabled, multiple elements can be selected */
	multiple?: boolean;
	/** Model what items should be selected */
	modelValue?: (number | string)[];
	/** Items that do not have the same scope will be ignored */
	scope?: string;
}

const props = withDefaults(defineProps<Props>(), {
	mandatory: false,
	max: -1,
	multiple: false,
	modelValue: undefined,
	scope: 'item-group',
});

const emit = defineEmits(['update:modelValue']);

const { modelValue: selection, multiple, max, mandatory } = toRefs(props);

useGroupableParent(
	{
		selection: selection,
		onSelectionChange: (newSelectionValues) => emit('update:modelValue', newSelectionValues),
	},
	{
		multiple: multiple,
		max: max,
		mandatory: mandatory,
	},
	props.scope,
);
</script>

<template>
	<div class="v-item-group">
		<slot />
	</div>
</template>
