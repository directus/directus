<script setup lang="ts">
import DisplayColor from '@/displays/color/color.vue';
import { computed } from 'vue';
import VCheckbox from '../v-checkbox.vue';
import VDivider from '../v-divider.vue';
import VIcon from '../v-icon/v-icon.vue';
import VListItemContent from '../v-list-item-content.vue';
import VListItemIcon from '../v-list-item-icon.vue';
import VListItem from '../v-list-item.vue';
import { Option } from './types';

const props = withDefaults(
	defineProps<{
		item: Option;
		itemLabelFontFamily?: string;
		modelValue?: string | number | (string | number)[] | null;
		multiple?: boolean;
		allowOther?: boolean;
		nonEditable?: boolean;
	}>(),
	{
		itemLabelFontFamily: 'var(--v-select-font-family)',
		modelValue: null,
		multiple: true,
		allowOther: false,
		nonEditable: false,
	},
);

defineEmits(['update:modelValue']);

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
</script>

<template>
	<VDivider v-if="item.divider === true" />

	<VListItem
		v-else
		v-show="!item.hidden"
		:active="isActive"
		:disabled="item.disabled"
		:value="item.value"
		:clickable="!multiple"
		@click="multiple ? undefined : $emit('update:modelValue', item.value)"
	>
		<VListItemIcon v-if="multiple === false && allowOther === false && (item.icon || item.color)">
			<VIcon v-if="item.icon" :name="item.icon" :color="item.color" />
			<DisplayColor v-else :value="item.color" />
		</VListItemIcon>
		<VListItemContent>
			<span
				v-if="multiple === false || item.selectable === false"
				class="item-text"
				:class="{ 'item-text-margin': multiple === false && allowOther === false && item.icon === null }"
			>
				{{ item.text }}
			</span>
			<VCheckbox
				v-else
				class="checkbox"
				:model-value="modelValue || []"
				:label="item.text"
				:value="item.value"
				:disabled="item.disabled || nonEditable"
				:non-editable="nonEditable"
				@update:model-value="$emit('update:modelValue', $event.length > 0 ? $event : null)"
			/>
		</VListItemContent>
	</VListItem>
</template>

<style scoped>
.item-text,
.checkbox :deep(.type-text) {
	font-family: v-bind('itemLabelFontFamily');
}

.item-text-margin {
	margin-inline-start: 32px;
}

.color-dot {
	margin-inline: 6px;
}
</style>
