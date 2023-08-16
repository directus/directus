<template>
	<v-list>
		<v-list-item clickable @click="$emit('edit-raw')">
			<v-list-item-icon><v-icon name="code" /></v-list-item-icon>
			<v-list-item-content>{{ restricted ? t('view_raw_value') : t('edit_raw_value') }}</v-list-item-content>
		</v-list-item>
		<v-list-item v-if="isCopySupported" :disabled="modelValue === null" clickable @click="$emit('copy-raw')">
			<v-list-item-icon><v-icon name="content_copy" /></v-list-item-icon>
			<v-list-item-content>{{ t('copy_raw_value') }}</v-list-item-content>
		</v-list-item>
		<v-list-item v-if="isPasteSupported && !restricted" clickable @click="$emit('paste-raw')">
			<v-list-item-icon><v-icon name="content_paste" /></v-list-item-icon>
			<v-list-item-content>{{ t('paste_raw_value') }}</v-list-item-content>
		</v-list-item>
		<v-divider v-if="!restricted" />
		<v-list-item
			v-if="!restricted && defaultValue !== null"
			:disabled="modelValue === defaultValue"
			clickable
			@click="$emit('update:modelValue', defaultValue)"
		>
			<v-list-item-icon>
				<v-icon name="settings_backup_restore" />
			</v-list-item-icon>
			<v-list-item-content>{{ t('reset_to_default') }}</v-list-item-content>
		</v-list-item>
		<v-list-item
			v-if="!restricted && initialValue"
			:disabled="initialValue === undefined || modelValue === initialValue"
			clickable
			@click="$emit('unset', field)"
		>
			<v-list-item-icon>
				<v-icon name="undo" />
			</v-list-item-icon>
			<v-list-item-content>{{ t('undo_changes') }}</v-list-item-content>
		</v-list-item>
		<v-list-item
			v-if="!restricted && (defaultValue === null || !isRequired)"
			:disabled="modelValue === null || relational"
			clickable
			@click="$emit('update:modelValue', null)"
		>
			<v-list-item-icon><v-icon name="delete" /></v-list-item-icon>
			<v-list-item-content>{{ t('clear_value') }}</v-list-item-content>
		</v-list-item>
	</v-list>
</template>

<script setup lang="ts">
import { useClipboard } from '@/composables/use-clipboard';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { FormField } from './types';

interface Props {
	field: FormField;
	modelValue?: string | number | boolean | Record<string, any> | Array<any> | null;
	initialValue?: string | number | boolean | Record<string, any> | Array<any> | null;
	restricted?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: null,
	initialValue: null,
	restricted: false,
});

defineEmits(['update:modelValue', 'unset', 'edit-raw', 'copy-raw', 'paste-raw']);

const { t } = useI18n();

const { isCopySupported, isPasteSupported } = useClipboard();

const defaultValue = computed(() => {
	const savedValue = props.field?.schema?.default_value;
	return savedValue !== undefined ? savedValue : null;
});

const isRequired = computed(() => {
	return props.field?.schema?.is_nullable === false;
});

const relational = computed(
	() =>
		props.field.meta?.special?.find((type) =>
			['file', 'files', 'm2o', 'o2m', 'm2m', 'm2a', 'translations'].includes(type)
		) !== undefined
);
</script>
