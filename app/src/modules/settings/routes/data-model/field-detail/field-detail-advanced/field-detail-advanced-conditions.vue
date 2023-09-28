<script setup lang="ts">
import { useExtension } from '@/composables/use-extension';
import { DeepPartial, Field } from '@directus/types';
import { isVueComponent } from '@directus/utils';
import { storeToRefs } from 'pinia';
import { computed, unref } from 'vue';
import { useI18n } from 'vue-i18n';
import { syncFieldDetailStoreProperty, useFieldDetailStore } from '../store';

const { t } = useI18n();

const fieldDetailStore = useFieldDetailStore();

const { loading, field, collection } = storeToRefs(fieldDetailStore);

const conditions = syncFieldDetailStoreProperty('field.meta.conditions');
const interfaceId = computed(() => field.value.meta?.interface ?? null);

const conditionsSync = computed({
	get() {
		return { conditions: conditions.value };
	},
	set(value) {
		if (!value.conditions || value.conditions.length === 0) {
			conditions.value = null;
			return;
		}

		const conditionsWithDefaults = value.conditions.map((condition: any) => {
			const conditionOptions = condition.options ?? {};
			const defaultValues = unref(optionDefaults);
			condition.options = { ...defaultValues, ...conditionOptions };
			return condition;
		});

		conditions.value = conditionsWithDefaults;
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
				collectionName: collection.value,
				includeRelations: false,
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
		collection: collection.value,
		type: 'json',
		meta: {
			interface: 'system-interface-options',
			options: {
				interface: interfaceId.value,
				context: useFieldDetailStore,
			},
		},
	},
]);

const selectedInterface = useExtension('interface', interfaceId);

const optionDefaults = computed(() => {
	if (!selectedInterface.value?.options || isVueComponent(selectedInterface.value.options)) return [];

	let optionsObjectOrArray;

	if (typeof selectedInterface.value.options === 'function') {
		optionsObjectOrArray = selectedInterface.value.options({
			field: {
				type: 'unknown',
			},
			editing: '+',
			collection: collection.value,
			relations: {
				o2m: undefined,
				m2o: undefined,
				m2a: undefined,
			},
			collections: {
				related: undefined,
				junction: undefined,
			},
			fields: {
				corresponding: undefined,
				junctionCurrent: undefined,
				junctionRelated: undefined,
				sort: undefined,
			},
			items: {},
			localType: 'standard',
			autoGenerateJunctionRelation: false,
			saving: false,
		});
	} else {
		optionsObjectOrArray = selectedInterface.value.options;
	}

	const optionsArray = Array.isArray(optionsObjectOrArray)
		? optionsObjectOrArray
		: [...optionsObjectOrArray.standard, ...optionsObjectOrArray.advanced];

	return optionsArray
		.filter((option) => option.schema?.default_value !== undefined)
		.reduce((result, option) => ({ ...result, [option.field]: option.schema.default_value }), {});
});

const fields = computed(() => [
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
	<v-form v-model="conditionsSync" :fields="fields" :loading="loading" />
</template>
