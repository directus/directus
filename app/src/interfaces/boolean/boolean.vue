<script setup lang="ts">
import { i18n } from '@/lang';
import { BaseProps } from '..';

withDefaults(
	defineProps<
		BaseProps & {
			value: boolean | null;
			label?: string;
			iconOn?: string;
			iconOff?: string;
			colorOn?: string;
			colorOff?: string;
		}
	>(),
	{
		label: () => i18n.global.t('enabled'),
		iconOn: 'check_box',
		iconOff: 'check_box_outline_blank',
		colorOn: 'var(--theme--primary)',
		colorOff: 'var(--theme--form--field--input--foreground-subdued)',
	},
);

defineEmits<{
	(e: 'input', value: boolean | null): void;
}>();
</script>

<template>
	<v-checkbox
		block
		:icon-on="iconOn"
		:icon-off="iconOff"
		:label="label"
		:model-value="value"
		:indeterminate="value === null"
		:disabled="disabled"
		:active="active"
		:style="{
			'--v-checkbox-color': colorOn,
			'--v-checkbox-unchecked-color': colorOff,
		}"
		@update:model-value="$emit('input', $event)"
	/>
</template>
