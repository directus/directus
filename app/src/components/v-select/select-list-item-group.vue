<script setup lang="ts">
import { computed } from 'vue';
import VCheckbox from '../v-checkbox.vue';
import VIcon from '../v-icon/v-icon.vue';
import VListGroup from '../v-list-group.vue';
import VListItemContent from '../v-list-item-content.vue';
import VListItemIcon from '../v-list-item-icon.vue';
import SelectListItem from './select-list-item.vue';
import { Option } from './types';

const props = withDefaults(
	defineProps<{
		item: Option;
		itemLabelFontFamily?: string;
		modelValue?: string | number | (string | number)[] | null;
		multiple?: boolean;
		allowOther?: boolean;
		groupSelectable?: boolean;
		nonEditable?: boolean;
	}>(),
	{
		modelValue: null,
		multiple: true,
		allowOther: true,
		groupSelectable: false,
		nonEditable: false,
	},
);

const emit = defineEmits(['update:modelValue']);

const isActive = computed(() => {
	if (props.multiple) {
		if (!Array.isArray(props.modelValue) || !props.item.value) {
			return false;
		}

		return props.modelValue.includes(props.item.value);
	} else {
		return props.modelValue === props.item.value;
	}
});

function onGroupClick(item: Option) {
	if (!props.groupSelectable || props.nonEditable) return;

	emit('update:modelValue', item.value);
}
</script>

<template>
	<v-list-group
		v-show="!item.hidden"
		:active="isActive"
		:clickable="(groupSelectable || item.selectable) && !nonEditable"
		:value="item.value"
		@click="onGroupClick(item)"
	>
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
					:non-editable="nonEditable"
					@update:model-value="$emit('update:modelValue', $event.length > 0 ? $event : null)"
				/>
			</v-list-item-content>
		</template>

		<template v-for="(childItem, index) in item.children" :key="index">
			<select-list-item-group
				v-if="childItem.children"
				:item="childItem"
				:item-label-font-family="itemLabelFontFamily"
				:model-value="modelValue"
				:multiple="multiple"
				:allow-other="allowOther"
				:group-selectable="groupSelectable"
				:non-editable="nonEditable"
				@update:model-value="$emit('update:modelValue', $event)"
			/>
			<select-list-item
				v-else
				:model-value="modelValue"
				:item="childItem"
				:item-label-font-family="itemLabelFontFamily"
				:multiple="multiple"
				:allow-other="allowOther"
				:non-editable="nonEditable"
				@update:model-value="$emit('update:modelValue', $event)"
			/>
		</template>
	</v-list-group>
</template>
