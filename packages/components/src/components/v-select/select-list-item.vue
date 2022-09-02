<template>
	<v-divider v-if="item.divider === true" />

	<v-list-item
		v-else
		:active="isActive"
		:disabled="item.disabled"
		clickable
		:value="item.value"
		@click="multiple ? null : $emit('update:modelValue', item.value)"
	>
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
	</v-list-item>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { Option } from './types';

interface Props {
	item: Option;
	modelValue?: string | number | (string | number)[] | null;
	multiple?: boolean;
	allowOther?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: null,
	multiple: true,
	allowOther: false,
});

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
