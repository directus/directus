<template>
	<v-list dense>
		<v-list-item :disabled="value === null" @click="$emit('input', null)">
			<v-list-item-icon><v-icon name="delete_outline" /></v-list-item-icon>
			<v-list-item-content>{{ $t('clear_value') }}</v-list-item-content>
		</v-list-item>
		<v-list-item
			:disabled="!field.schema || !field.schema.default_value"
			@click="$emit('input', field.schema.default_value)"
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
	</v-list>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
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
});
</script>
