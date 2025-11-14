<script setup lang="ts">
withDefaults(
	defineProps<{
		value: boolean | null;
		disabled?: false;
		nonEditable?: boolean;
		label?: string;
		iconOn?: string;
		iconOff?: string;
		colorOn?: string;
		colorOff?: string;
	}>(),
	{
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
		:class="{ 'non-editable': nonEditable }"
		block
		:icon-on="iconOn"
		:icon-off="iconOff"
		:label="label || $t('enabled')"
		:model-value="value"
		:indeterminate="value === null"
		:disabled="disabled"
		:non-editable="nonEditable"
		:style="{
			'--v-checkbox-color': colorOn,
			'--v-checkbox-unchecked-color': colorOff,
		}"
		@update:model-value="$emit('input', $event)"
	/>
</template>
