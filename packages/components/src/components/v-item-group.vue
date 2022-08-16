<template>
	<div class="v-item-group">
		<slot />
	</div>
</template>

<script setup lang="ts">
import { toRefs } from 'vue';
import { useGroupableParent } from '../composables';

interface Props {
	mandatory?: boolean;
	max?: number;
	multiple?: boolean;
	modelValue?: (number | string)[];
	scope?: string;
}

const props = withDefaults(defineProps<Props>(), {
	mandatory: false,
	max: -1,
	multiple: false,
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
	props.scope
);
</script>
