<template>
	<v-list-group :clickable="item.selectable" :value="item.value">
		<template #activator>
			<v-list-item-icon v-if="multiple === false && allowOther === false && item.icon">
				<v-icon :name="item.icon" />
			</v-list-item-icon>
			<v-list-item-content>
				<span v-if="multiple === false || item.selectable === false" class="item-text">{{ item.text }}</span>
				<v-checkbox
					v-else
					:model-value="modelValue || []"
					:label="item.text"
					:value="item.value"
					:disabled="item.disabled"
					@update:model-value="$emit('update:modelValue', $event.length > 0 ? $event : null)"
				/>
			</v-list-item-content>
		</template>

		<template v-for="(childItem, index) in item.children" :key="index">
			<select-list-item-group
				v-if="childItem.children"
				:item="childItem"
				:model-value="modelValue"
				:multiple="multiple"
				:allow-other="allowOther"
				@update:model-value="$emit('update:modelValue', $event)"
			/>
			<select-list-item
				v-else
				:model-value="modelValue"
				:item="childItem"
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
	emits: ['update:modelValue'],
});
</script>
