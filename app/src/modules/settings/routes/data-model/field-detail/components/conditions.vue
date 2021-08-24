<template>
	<div>
		<interface-list :fields="repeaterFields" template="{{ name }}" :value="value" @input="value = $event" />
	</div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { Field, Condition, DeepPartial } from '@directus/shared/types';
import { useI18n } from 'vue-i18n';
import { state } from '../store';
import { get, set } from 'lodash';

export default defineComponent({
	props: {
		type: {
			type: String,
			required: true,
		},
		collection: {
			type: String,
			required: true,
		},
	},
	setup(props) {
		const { t } = useI18n();

		const value = computed({
			get() {
				return get(state, 'fieldData.meta.conditions', []);
			},
			set(value: Condition[]) {
				set(state, 'fieldData.meta.conditions', value);
			},
		});

		const repeaterFields = computed<DeepPartial<Field>[]>(() => [
			{
				field: 'name',
				name: t('name'),
				type: 'string',
				meta: {
					interface: 'input',
					options: {
						iconLeft: 'label',
						placeholder: t('enter_a_value'),
					},
				},
			},
			{
				field: 'rule',
				name: t('rule'),
				type: 'json',
				meta: {
					interface: 'system-filter',
					options: {
						collectionName: props.collection,
					},
				},
			},
			{
				field: 'readonly',
				name: t('readonly'),
				type: 'boolean',
				meta: {
					interface: 'boolean',
					options: {
						label: t('disabled_editing_value'),
					},
					width: 'half',
				},
			},
			{
				field: 'hidden',
				name: t('hidden'),
				type: 'boolean',
				meta: {
					interface: 'boolean',
					options: {
						label: t('hidden_on_detail'),
					},
					width: 'half',
				},
			},
			{
				field: 'required',
				name: t('required'),
				type: 'boolean',
				meta: {
					interface: 'boolean',
					options: {
						label: t('require_value_to_be_set'),
					},
					width: 'half',
				},
			},
			{
				field: 'options',
				name: t('interface_options'),
				type: 'json',
				meta: {
					interface: 'system-interface-options',
					options: {
						interface: state?.fieldData.meta?.interface,
					},
				},
			},
		]);

		return { repeaterFields, value, state };
	},
});
</script>
