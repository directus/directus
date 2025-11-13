<script setup lang="ts">
import { i18n } from '@/lang';
import { isEmpty, isEqual } from 'lodash';
import { computed, watch } from 'vue';

type Option = {
	text: string;
	value: string | number | boolean;
	icon?: string | null;
	color?: string | null;
	children?: Option[];
};

const props = withDefaults(
	defineProps<{
		value: string | number | null;
		disabled?: boolean;
		choices?: Option[];
		icon?: string;
		allowNone?: boolean;
		placeholder?: string;
		allowOther?: boolean;
	}>(),
	{
		placeholder: () => i18n.global.t('select_an_item'),
	},
);

const emit = defineEmits(['input', 'focus', 'blur']);

const applyGlobalIcon = computed(() => props.choices?.some((choice) => choice.icon));

const items = computed(() => {
	if (!props.choices) {
		return [];
	}

	if (!applyGlobalIcon.value) {
		return props.choices;
	}

	return props.choices.map((choice) => {
		const choiceCopy = { ...choice };

		if (!choiceCopy.icon && !choiceCopy.color) {
			choiceCopy.icon = props.icon ?? null;
		}

		return choiceCopy;
	});
});

const showGlobalIcon = computed(() => {
	if (!props.icon) {
		return false;
	}

	if (!applyGlobalIcon.value) {
		return true;
	}

	if (isEmpty(props.value)) {
		return true;
	}

	return false;
});

watch(
	() => props.choices,
	(newChoices, oldChoices) => {
		if (
			props.value !== null &&
			!isEqual(newChoices, oldChoices) &&
			!newChoices?.some((choice) => choice.value === props.value)
		) {
			// Reset if the options have dynamically changed and the current value is not available anymore
			emit('input', null);
		}
	},
);
</script>

<template>
	<v-select
		:model-value="value"
		:items="items"
		:disabled="disabled"
		:show-deselect="allowNone"
		item-icon="icon"
		item-color="color"
		:placeholder="placeholder"
		:allow-other="allowOther"
		@update:model-value="$emit('input', $event)"
	>
		<template v-if="showGlobalIcon" #prepend>
			<v-icon :name="icon" />
		</template>
	</v-select>
</template>
