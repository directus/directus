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

const clickable = computed(() => {
	return (props.groupSelectable || props.item.selectable) && props.item.selectable !== false && !props.nonEditable;
});

function onGroupClick(item: Option) {
	if (!clickable.value) return;

	emit('update:modelValue', item.value);
}
</script>

<template>
	<VListGroup
		v-show="!item.hidden"
		:active="isActive"
		:clickable="clickable"
		:value="item.value"
		@click="onGroupClick(item)"
	>
		<template #activator>
			<VListItemIcon v-if="multiple === false && allowOther === false && item.icon">
				<VIcon :name="item.icon" />
			</VListItemIcon>
			<VListItemContent>
				<span v-if="multiple === false || item.selectable === false" class="item-text">{{ item.text }}</span>
				<VCheckbox
					v-else
					:model-value="modelValue || []"
					:label="item.text"
					:value="item.value"
					:disabled="item.disabled"
					:non-editable="nonEditable"
					@update:model-value="$emit('update:modelValue', $event.length > 0 ? $event : null)"
				/>
			</VListItemContent>
		</template>

		<template v-for="(childItem, index) in item.children" :key="index">
			<SelectListItemGroup
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
			<SelectListItem
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
	</VListGroup>
</template>
