<template>
	<div>
		<interface-list :fields="repeaterFields" template="{{ name }}" :value="conditions" @input="conditions = $event" />
	</div>
</template>

<script lang="ts">
import { defineComponent, computed } from 'vue';
import { Field, DeepPartial } from '@directus/shared/types';
import { useI18n } from 'vue-i18n';
import { useFieldDetailStore, syncFieldDetailStoreProperty } from '../store';
import { storeToRefs } from 'pinia';

export default defineComponent({
	setup() {
		const { t } = useI18n();

		const fieldDetailStore = useFieldDetailStore();

		const { field, collection } = storeToRefs(fieldDetailStore);

		const conditions = syncFieldDetailStoreProperty('field.meta.conditions');
		const interfaceID = computed(() => field.value.meta?.interface);

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
						interface: interfaceID.value,
					},
				},
			},
		]);

		return { repeaterFields, conditions };
	},
});
</script>
