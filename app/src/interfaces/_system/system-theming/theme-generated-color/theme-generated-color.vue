<template>
	<theme-generated-swatch
		:model-value="value"
		:source-name="sourceName"
		:field-data="fieldData"
		:field="field"
	></theme-generated-swatch>
</template>

<script lang="ts">
export default {
	name: 'ThemeGeneratedSwatch',
};
</script>

<script lang="ts" setup>
import { Field, ValidationError } from '@directus/shared/types';
import themeGeneratedSwatch from '../components/theme-generated-swatch.vue';
import { computed } from 'vue';
import { useThemeStore } from '@/stores';

interface Props {
	value: string;
	generateType?: string;
	disabled?: boolean;
	validationErrors?: ValidationError[];
	field: string;
	fieldData: Field;
	primaryKey: string | number;
	batchMode?: boolean;
	batchActiveFields?: string[];
	loading?: boolean;
	backgroundSource?: string;
}

const props = withDefaults(defineProps<Props>(), {
	generateType: 'subtle',
	disabled: false,
	validationErrors: () => [],
	batchMode: false,
	batchActiveFields: () => [],
	loading: false,
	backgroundSource: undefined,
});

const themeStore = useThemeStore();

const themeFields = themeStore.getFields;

const thisField = themeFields.find((field) => {
	return field.field === props.field;
});

const sourcePath = thisField?.meta?.options?.source || '';

const sourceName = computed(() => {
	if (sourcePath) {
		const sourceField = themeFields.find((field) => {
			return field.field === sourcePath;
		});
		return sourceField?.name;
	}
	return undefined;
});
</script>
