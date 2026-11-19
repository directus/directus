<script setup lang="ts">
import VCheckbox from '@/components/v-checkbox.vue';
import VSwitch from '@/components/v-switch.vue';

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
		appearance?: 'checkbox' | 'switch';
	}>(),
	{
		iconOn: 'check_box',
		iconOff: 'check_box_outline_blank',
		colorOn: 'var(--theme--primary)',
		colorOff: 'var(--theme--form--field--input--foreground-subdued)',
		appearance: 'checkbox',
	},
);

defineEmits<{
	(e: 'input', value: boolean | null): void;
}>();
</script>

<template>
	<VSwitch
		v-if="appearance === 'switch'"
		block
		:label="label || $t('enabled')"
		:model-value="value"
		:disabled="disabled"
		:non-editable="nonEditable"
		@update:model-value="$emit('input', $event)"
	/>
	<VCheckbox
		v-else
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
