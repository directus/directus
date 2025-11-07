<script setup lang="ts">
import { sortBy } from 'lodash';
import { computed } from 'vue';

type Option = {
	text: string;
	value: string | number | boolean;
};

const props = withDefaults(
	defineProps<{
		value?: string[];
		disabled?: boolean;
		nonEditable?: boolean;
		choices?: Option[];
		icon?: string;

		allowNone?: boolean;
		placeholder?: string;
		allowOther?: boolean;
		previewThreshold?: number;
	}>(),
	{
		previewThreshold: 3,
		nonEditable: false,
	},
);

const emit = defineEmits(['input']);

const items = computed(() => props.choices || []);

function updateValue(value: string[]) {
	const sortedValue = sortBy(value, (val) => {
		const sortIndex = items.value!.findIndex((item) => val === item.value);
		return sortIndex !== -1 ? sortIndex : value.length;
	});

	emit('input', sortedValue);
}
</script>

<template>
	<v-select
		multiple
		:model-value="value"
		:items="items"
		:disabled="disabled"
		:non-editable="nonEditable"
		:show-deselect="allowNone"
		:placeholder="placeholder"
		:allow-other="allowOther && !nonEditable"
		:close-on-content-click="false"
		:multiple-preview-threshold="previewThreshold"
		@update:model-value="updateValue($event)"
	>
		<template v-if="icon" #prepend>
			<v-icon :name="icon" />
		</template>
	</v-select>
</template>
