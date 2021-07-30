<template>
	<v-list-group>
		<template #activator>
			<select-list-item
				:model-value="modelValue"
				:item="item"
				:multiple="multiple"
				:allow-other="allowOther"
				@update:model-value="$emit('update:modelValue', $event)"
			/>
		</template>

		<template v-for="(item, index) in item.children" :key="index">
			<select-list-item-group
				v-if="item.children"
				:item="item"
				:model-value="modelValue"
				:multiple="multiple"
				:allow-other="allowOther"
				@update:model-value="$emit('update:modelValue', $event)"
			/>
			<select-list-item
				v-else
				:model-value="modelValue"
				:item="item"
				:multiple="multiple"
				:allow-other="allowOther"
				@update:model-value="$emit('update:modelValue', $event)"
			/>
		</template>
	</v-list-group>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import { Option } from './types';
import SelectListItem from './select-list-item.vue';

export default defineComponent({
	name: 'SelectListItemGroup',
	components: { SelectListItem },
	props: {
		item: {
			type: Object as PropType<Option>,
			required: true,
		},
		modelValue: {
			type: [String, Number, Array] as PropType<string | number | (string | number)[]>,
			default: null,
		},
		multiple: {
			type: Boolean,
			required: true,
		},
		allowOther: {
			type: Boolean,
			required: true,
		},
	},
});
</script>
