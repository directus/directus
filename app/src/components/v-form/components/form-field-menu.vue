<script setup lang="ts">
import { useClipboard } from '@/composables/use-clipboard';
import { RELATIONAL_TYPES } from '@directus/constants';
import type { RelationalType } from '@directus/types';
import { computed } from 'vue';
import type { FormField } from '../types';
import VDivider from '@/components/v-divider.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VList from '@/components/v-list.vue';
import VListItem from '@/components/v-list-item.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';

export type MenuOptions =
	| 'edit-raw'
	| 'view-raw'
	| 'copy-raw'
	| 'paste-raw'
	| 'reset-to-default'
	| 'undo-changes'
	| 'clear-value';

const props = withDefaults(
	defineProps<{
		field: FormField;
		modelValue?: string | number | boolean | Record<string, any> | Array<any> | null;
		initialValue?: string | number | boolean | Record<string, any> | Array<any> | null;
		restricted?: boolean;
		disabledOptions?: MenuOptions[];
	}>(),
	{
		modelValue: null,
		initialValue: null,
		disabledOptions: () => [],
	},
);

defineEmits(['update:modelValue', 'unset', 'edit-raw', 'copy-raw', 'paste-raw']);

const { isCopySupported, isPasteSupported } = useClipboard();

const defaultValue = computed(() => {
	const savedValue = props.field?.schema?.default_value;
	return savedValue !== undefined ? savedValue : null;
});

const isRequired = computed(() => {
	return props.field?.schema?.is_nullable === false;
});

const localDisabledOptions = computed(() => {
	const disabledOptions = new Set(props.disabledOptions);

	if (props.restricted) disabledOptions.add('edit-raw');

	if (!props.restricted) disabledOptions.add('view-raw');

	if (!isCopySupported.value) disabledOptions.add('copy-raw');

	if (!isPasteSupported.value || props.restricted) disabledOptions.add('paste-raw');

	if (defaultValue.value === null || props.restricted) disabledOptions.add('reset-to-default');

	if (!props.initialValue || props.restricted) disabledOptions.add('undo-changes');

	if ((isRequired.value && defaultValue.value !== null) || props.restricted) disabledOptions.add('clear-value');

	return disabledOptions;
});

const showDivider = computed(() => {
	const upperOptions = (['edit-raw', 'view-raw', 'copy-raw', 'paste-raw'] as MenuOptions[]).some(
		(option) => !localDisabledOptions.value.has(option),
	);

	const lowerOptions = (['reset-to-default', 'undo-changes', 'clear-value'] as MenuOptions[]).some(
		(option) => !localDisabledOptions.value.has(option),
	);

	return upperOptions && lowerOptions;
});

const relational = computed(
	() => props.field.meta?.special?.find((type) => RELATIONAL_TYPES.includes(type as RelationalType)) !== undefined,
);
</script>

<template>
	<v-list>
		<v-list-item v-if="!localDisabledOptions.has('edit-raw')" clickable @click="$emit('edit-raw')">
			<v-list-item-icon><v-icon name="code" /></v-list-item-icon>
			<v-list-item-content>{{ $t('edit_raw_value') }}</v-list-item-content>
		</v-list-item>
		<v-list-item v-if="!localDisabledOptions.has('view-raw')" clickable @click="$emit('edit-raw')">
			<v-list-item-icon><v-icon name="code" /></v-list-item-icon>
			<v-list-item-content>{{ $t('view_raw_value') }}</v-list-item-content>
		</v-list-item>
		<v-list-item
			v-if="!localDisabledOptions.has('copy-raw')"
			:disabled="modelValue === null"
			clickable
			@click="$emit('copy-raw')"
		>
			<v-list-item-icon><v-icon name="content_copy" /></v-list-item-icon>
			<v-list-item-content>{{ $t('copy_raw_value') }}</v-list-item-content>
		</v-list-item>
		<v-list-item v-if="!localDisabledOptions.has('paste-raw')" clickable @click="$emit('paste-raw')">
			<v-list-item-icon><v-icon name="content_paste" /></v-list-item-icon>
			<v-list-item-content>{{ $t('paste_raw_value') }}</v-list-item-content>
		</v-list-item>
		<v-divider v-if="showDivider" />
		<v-list-item
			v-if="!localDisabledOptions.has('reset-to-default')"
			:disabled="modelValue === defaultValue"
			clickable
			@click="$emit('update:modelValue', defaultValue)"
		>
			<v-list-item-icon>
				<v-icon name="settings_backup_restore" />
			</v-list-item-icon>
			<v-list-item-content>{{ $t('reset_to_default') }}</v-list-item-content>
		</v-list-item>
		<v-list-item
			v-if="!localDisabledOptions.has('undo-changes')"
			:disabled="initialValue === undefined || modelValue === initialValue"
			clickable
			@click="$emit('unset', field)"
		>
			<v-list-item-icon>
				<v-icon name="undo" />
			</v-list-item-icon>
			<v-list-item-content>{{ $t('undo_changes') }}</v-list-item-content>
		</v-list-item>
		<v-list-item
			v-if="!localDisabledOptions.has('clear-value')"
			:disabled="modelValue === null || relational"
			clickable
			@click="$emit('update:modelValue', null)"
		>
			<v-list-item-icon><v-icon name="delete" /></v-list-item-icon>
			<v-list-item-content>{{ $t('clear_value') }}</v-list-item-content>
		</v-list-item>
	</v-list>
</template>
