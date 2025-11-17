<script setup lang="ts">
import { DeepPartial, Field } from '@directus/types';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { syncFieldDetailStoreProperty, useFieldDetailStore } from '../store';

const { t } = useI18n();

const fieldDetailStore = useFieldDetailStore();

const { loading, field, collection } = storeToRefs(fieldDetailStore);

const interfaceId = computed(() => field.value.meta?.interface ?? null);
const conditions = syncFieldDetailStoreProperty('field.meta.conditions');

const conditionsSync = computed({
	get() {
		return { conditions: conditions.value };
	},
	set(value) {
		conditions.value = value.conditions;
	},
});

const conditionsInitial = conditionsSync.value;

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
				collectionName: collection.value,
				includeRelations: false,
				injectVersionField: true,
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
				label: t('readonly_field_label'),
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
		field: 'clear_hidden_value_on_save',
		name: t('clear_hidden_field'),
		type: 'boolean',
		meta: {
			interface: 'boolean',
			readonly: true,
			options: {
				label: t('clear_value_on_save_when_hidden'),
			},
			width: 'half',
			conditions: [
				{
					rule: {
						hidden: { _eq: true },
					},
					readonly: false, // enable the field when hidden is true
				},
			],
		},
	},
	{
		field: 'options',
		name: t('interface_options'),
		collection: collection.value,
		type: 'json',
		meta: {
			interface: 'system-interface-options',
			options: {
				isConditionOptions: true,
				interface: interfaceId.value,
				context: useFieldDetailStore,
			},
		},
	},
]);

const fields = computed<DeepPartial<Field>[]>(() => [
	{
		field: 'conditions',
		name: t('conditions'),
		type: 'json',
		meta: {
			interface: 'list',
			options: {
				fields: repeaterFields,
				template: '{{ name }}',
			},
		},
	},
]);
</script>

<template>
	<v-form v-model="conditionsSync" :initial-values="conditionsInitial" :fields="fields" :loading="loading" />
</template>
