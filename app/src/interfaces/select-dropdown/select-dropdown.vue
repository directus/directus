<script setup lang="ts">
import { computed } from 'vue';
import { i18n } from '@/lang';
import { useI18n } from 'vue-i18n';
import { isEmpty } from 'lodash';

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

defineEmits(['input']);

const { t } = useI18n();

const applyGlobalIcon = computed(() => props.choices?.some((choice) => choice.icon));

const items = computed(() => {
	if (!applyGlobalIcon.value) {
		return props.choices;
	}

	return props.choices?.map((choice) => {
		if (choice.icon) {
			return choice;
		}

		if (!choice.icon && !choice.color) {
			choice.icon = props.icon ?? null;
		}

		return choice;
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
</script>

<template>
	<v-notice v-if="!items" type="warning">
		{{ t('choices_option_configured_incorrectly') }}
	</v-notice>
	<v-select
		v-else
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
