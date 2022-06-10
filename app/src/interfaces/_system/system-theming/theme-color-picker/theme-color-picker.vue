<template>
	<theme-color-picker :model-value="value" @update:model-value="$emit('input', $event)"></theme-color-picker>
</template>

<script lang="ts">
export default {
	name: 'ThemeColorPicker',
};
</script>

<script lang="ts" setup>
import { ValidationError } from '@directus/shared/types';
import themeColorPicker from '../components/theme-color-picker.vue';

interface Props {
	value: string;
	disabled?: boolean;
	validationErrors?: ValidationError[];
	field: string;
	primaryKey: string | number;
	batchMode?: boolean;
	batchActiveFields?: string[];
	loading?: boolean;
}

withDefaults(defineProps<Props>(), {
	disabled: false,
	validationErrors: () => [],
	batchMode: false,
	batchActiveFields: () => [],
	loading: false,
});

defineEmits(['input']);
</script>
