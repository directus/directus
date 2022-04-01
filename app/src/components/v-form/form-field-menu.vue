<template>
	<v-list>
		<v-list-item clickable @click="$emit('edit-raw')">
			<v-list-item-icon><v-icon name="code" /></v-list-item-icon>
			<v-list-item-content>{{ restricted ? t('view_raw_value') : t('edit_raw_value') }}</v-list-item-content>
		</v-list-item>
		<v-list-item v-if="isCopySupported" :disabled="modelValue === null" clickable @click="$emit('copy-raw')">
			<v-list-item-icon><v-icon name="copy_outline" /></v-list-item-icon>
			<v-list-item-content>{{ t('copy_raw_value') }}</v-list-item-content>
		</v-list-item>
		<v-list-item v-if="isPasteSupported && !restricted" clickable @click="$emit('paste-raw')">
			<v-list-item-icon><v-icon name="paste_outline" /></v-list-item-icon>
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
			:disabled="modelValue === null"
			clickable
			@click="$emit('update:modelValue', null)"
		>
			<v-list-item-icon><v-icon name="delete_outline" /></v-list-item-icon>
			<v-list-item-content>{{ t('clear_value') }}</v-list-item-content>
		</v-list-item>
	</v-list>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType, computed } from 'vue';
import { Field } from '@directus/shared/types';

export default defineComponent({
	props: {
		field: {
			type: Object as PropType<Field>,
			required: true,
		},
		modelValue: {
			type: [String, Number, Object, Array, Boolean],
			default: null,
		},
		initialValue: {
			type: [String, Number, Object, Array, Boolean],
			default: null,
		},
		restricted: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:modelValue', 'unset', 'edit-raw', 'copy-raw', 'paste-raw'],
	setup(props) {
		const { t } = useI18n();

		const defaultValue = computed(() => {
			const savedValue = props.field?.schema?.default_value;
			return savedValue !== undefined ? savedValue : null;
		});

		const isRequired = computed(() => {
			return props.field?.schema?.is_nullable === false;
		});

		const isCopySupported = computed(() => {
			return !!navigator?.clipboard?.writeText;
		});

		const isPasteSupported = computed(() => {
			return !!navigator?.clipboard?.readText;
		});

		return { t, defaultValue, isRequired, isCopySupported, isPasteSupported };
	},
});
</script>
