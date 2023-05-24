<template>
	<div>
		<interface-list :fields="repeaterFields" template="{{ name }}" :value="conditions" @input="onInput($event)" />
	</div>
</template>

<script setup lang="ts">
import { computed, unref } from 'vue';
import { Field, DeepPartial } from '@directus/types';
import { useI18n } from 'vue-i18n';
import { useFieldDetailStore, syncFieldDetailStoreProperty } from '../store';
import { storeToRefs } from 'pinia';
import { useExtension } from '@/composables/use-extension';
import { isVueComponent } from '@directus/utils';

const { t } = useI18n();

const fieldDetailStore = useFieldDetailStore();

const { field, collection } = storeToRefs(fieldDetailStore);

const conditions = syncFieldDetailStoreProperty('field.meta.conditions');
const interfaceId = computed(() => field.value.meta?.interface ?? null);

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

function onInput(event: Array<any>) {
	conditions.value = (event ?? []).map((evt) => {
		const conditionOptions = evt.options ?? {};
		const defaultValues = unref(optionDefaults);
		evt.options = { ...defaultValues, ...conditionOptions };
		return evt;
	});
}
</script>
