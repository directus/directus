<template>
	<div>
		<p class="type-label half">{{ $t('template') }}</p>
		<v-input class="input" v-model="template" :placeholder="`{{ field }}`" />

		<p class="type-label half">{{ $t('max-amount') }}</p>
		<v-input class="input" type="number" v-model="limit" />

		<p class="type-label">{{ $t('edit_fields') }}</p>
		<repeater v-model="repeaterValue" :template="`{{ field }} — {{ interface }}`" :fields="repeaterFields" />
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import Repeater from './repeater.vue';
import { Field, FieldMeta } from '@/types';
import i18n from '@/lang';

export default defineComponent({
	components: { Repeater },
	props: {
		value: {
			type: Object as PropType<any>,
			default: null,
		},
	},
	setup(props, { emit }) {
		const repeaterValue = computed({
			get() {
				return props.value?.fields?.map((field: Field) => field.meta);
			},
			set(newVal: FieldMeta[]) {
				const fields = newVal.map((meta) => ({
					field: meta.field,
					meta,
				}));

				emit('input', {
					...(props.value || {}),
					fields: fields,
				});
			},
		});

		const repeaterFields: DeepPartial<Field>[] = [
			{
				name: i18n.tc('field', 1),
				field: 'field',
				type: 'string',
				meta: {
					interface: 'text-input',
					width: 'half',
					sort: 1,
					options: {
						font: 'monospace',
					},
				},
				schema: null,
			},
			{
				name: i18n.t('field_width'),
				field: 'width',
				type: 'string',
				meta: {
					interface: 'dropdown',
					width: 'half',
					sort: 2,
					options: {
						choices: [
							{
								value: 'half',
								text: i18n.t('half_width'),
							},
							{
								value: 'full',
								text: i18n.t('full_width'),
							},
						],
					},
				},
				schema: null,
			},
			{
				name: i18n.t('interface'),
				field: 'interface',
				type: 'string',
				meta: {
					interface: 'interface',
					width: 'half',
					sort: 3,
				},
				schema: null,
			},
			{
				name: i18n.t('note'),
				field: 'note',
				type: 'string',
				meta: {
					interface: 'text-input',
					width: 'half',
					sort: 4,
				},
				schema: null,
			},
			{
				name: i18n.t('options'),
				field: 'options',
				type: 'string',
				meta: {
					interface: 'interface-options',
					width: 'full',
					sort: 5,
					options: {
						interfaceField: 'interface',
					},
				},
			},
		];

		const limit = computed({
			get() {
				return props.value?.limit;
			},
			set(newLimit: string) {
				emit('input', {
					...(props.value || {}),
					limit: newLimit,
				});
			},
		});

		const template = computed({
			get() {
				return props.value?.template;
			},
			set(newTemplate: string) {
				emit('input', {
					...(props.value || {}),
					template: newTemplate,
				});
			},
		});

		return { repeaterValue, repeaterFields, template, limit };
	},
});
</script>

<style lang="scss" scoped>
.type-label {
	margin-bottom: 4px;
}

.input {
	margin-bottom: 24px;
}
</style>
