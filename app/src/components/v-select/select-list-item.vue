<script setup lang="ts">
import { computed } from 'vue';
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
	<v-divider v-if="item.divider === true" />

	<v-list-item
		v-else
		v-show="!item.hidden"
		:active="isActive"
		:disabled="item.disabled"
		:value="item.value"
		:clickable="!multiple"
		@click="multiple ? undefined : $emit('update:modelValue', item.value)"
	>
		<v-list-item-icon v-if="multiple === false && allowOther === false && (item.icon || item.color)">
			<v-icon v-if="item.icon" :name="item.icon" :color="item.color" />
			<display-color v-else :value="item.color" />
		</v-list-item-icon>
		<v-list-item-content>
			<span
				v-if="multiple === false || item.selectable === false"
				class="item-text"
				:class="{ 'item-text-margin': multiple === false && allowOther === false && item.icon === null }"
			>
				{{ item.text }}
			</span>
			<v-checkbox
				v-else
				class="checkbox"
				:model-value="modelValue || []"
				:label="item.text"
				:value="item.value"
				:disabled="item.disabled"
				:non-editable="nonEditable"
				@update:model-value="$emit('update:modelValue', $event.length > 0 ? $event : null)"
			/>
		</v-list-item-content>
	</v-list-item>
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
