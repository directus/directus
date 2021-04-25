<template>
	<v-list>
		<v-list-item
			v-if="defaultValue === null || !isRequired"
			:disabled="value === null"
			@click="$emit('input', null)"
		>
			<v-list-item-icon><v-icon name="delete_outline" /></v-list-item-icon>
			<v-list-item-content>{{ $t('clear_value') }}</v-list-item-content>
		</v-list-item>
		<v-list-item
			v-if="defaultValue !== null"
			:disabled="value === defaultValue"
			@click="$emit('input', defaultValue)"
		>
			<v-list-item-icon>
				<v-icon name="settings_backup_restore" />
			</v-list-item-icon>
			<v-list-item-content>{{ $t('reset_to_default') }}</v-list-item-content>
		</v-list-item>
		<v-list-item
			v-if="initialValue"
			:disabled="initialValue === undefined || value === initialValue"
			@click="$emit('unset', field)"
		>
			<v-list-item-icon>
				<v-icon name="undo" />
			</v-list-item-icon>
			<v-list-item-content>{{ $t('undo_changes') }}</v-list-item-content>
		</v-list-item>
		<v-list-item @click="$emit('edit-raw')">
			<v-list-item-icon><v-icon name="code" /></v-list-item-icon>
			<v-list-item-content>{{ $t('raw_value') }}</v-list-item-content>
		</v-list-item>
	</v-list>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref } from '@vue/composition-api';
import { Field } from '@/types';

export default defineComponent({
	props: {
		field: {
			type: Object as PropType<Field>,
			required: true,
		},
		value: {
			type: [String, Number, Object, Array, Boolean],
			default: null,
		},
		initialValue: {
			type: [String, Number, Object, Array, Boolean],
			default: null,
		},
	},
	setup(props) {
		const defaultValue = computed(() => {
			const savedValue = props.field?.schema?.default_value;
			return savedValue !== undefined ? savedValue : null;
		});

		const isRequired = computed(() => {
			return props.field?.schema?.is_nullable === false;
		});

		return { defaultValue, isRequired };
	},
});
</script>
