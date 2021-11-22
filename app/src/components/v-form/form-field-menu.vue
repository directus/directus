<template>
	<v-list>
		<v-list-item
			v-if="defaultValue === null || !isRequired"
			:disabled="modelValue === null"
			clickable
			@click="$emit('update:modelValue', null)"
		>
			<v-list-item-icon><v-icon name="delete_outline" /></v-list-item-icon>
			<v-list-item-content>{{ t('clear_value') }}</v-list-item-content>
		</v-list-item>
		<v-list-item
			v-if="defaultValue !== null"
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
			v-if="initialValue"
			:disabled="initialValue === undefined || modelValue === initialValue"
			clickable
			@click="$emit('unset', field)"
		>
			<v-list-item-icon>
				<v-icon name="undo" />
			</v-list-item-icon>
			<v-list-item-content>{{ t('undo_changes') }}</v-list-item-content>
		</v-list-item>
		<v-list-item clickable @click="$emit('edit-raw')">
			<v-list-item-icon><v-icon name="code" /></v-list-item-icon>
			<v-list-item-content>{{ t('raw_value') }}</v-list-item-content>
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
	},
	emits: ['update:modelValue', 'unset', 'edit-raw'],
	setup(props) {
		const { t } = useI18n();

		const defaultValue = computed(() => {
			const savedValue = props.field?.schema?.default_value;
			return savedValue !== undefined ? savedValue : null;
		});

		const isRequired = computed(() => {
			return props.field?.schema?.is_nullable === false;
		});

		return { t, defaultValue, isRequired };
	},
});
</script>
