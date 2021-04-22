<template>
	<div class="grid">
		<div class="grid-element half">
			<p class="type-label">{{ $t('template') }}</p>
			<v-input class="input" v-model="template" :placeholder="`{{ field }}`" />
		</div>

		<div class="grid-element half">
			<p class="type-label">{{ $t('interfaces.repeater.add_label') }}</p>
			<v-input class="input" v-model="addLabel" :placeholder="$t('create_new')" />
		</div>

		<div class="grid-element full">
			<p class="type-label">{{ $t('interfaces.repeater.edit_fields') }}</p>
			<repeater v-model="repeaterValue" :template="`{{ field }} — {{ interface }}`" :fields="repeaterFields" />
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from '@vue/composition-api';
import Repeater from './repeater.vue';
import { Field, FieldMeta } from '@/types';
import i18n from '@/lang';
import { fieldTypes } from '@/modules/settings/routes/data-model/field-detail/components/schema.vue';

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
			set(newVal: FieldMeta[] | null) {
				const fields = (newVal || []).map((meta: Record<string, any>) => ({
					field: meta.field,
					name: meta.name || meta.field,
					type: meta.type,
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
					sort: 2,
					options: {
						dbSafe: true,
						font: 'monospace',
						placeholder: i18n.t('interfaces.repeater.field_name_placeholder'),
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
					sort: 3,
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
				name: i18n.t('type'),
				field: 'type',
				type: 'string',
				meta: {
					interface: 'dropdown',
					width: 'half',
					sort: 4,
					options: {
						choices: fieldTypes,
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
					sort: 5,
					options: {
						typeField: 'type',
					},
				},
				schema: null,
			},
			{
				name: i18n.t('note'),
				field: 'note',
				type: 'string',
				meta: {
					interface: 'text-input',
					width: 'full',
					sort: 6,
					options: {
						placeholder: i18n.t('interfaces.repeater.field_note_placeholder'),
					},
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
					sort: 7,
					options: {
						interfaceField: 'interface',
					},
				},
			},
		];

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

		const addLabel = computed({
			get() {
				return props.value?.addLabel;
			},
			set(newAddLabel: string) {
				emit('input', {
					...(props.value || {}),
					addLabel: newAddLabel,
				});
			},
		});

		return { repeaterValue, repeaterFields, template, addLabel };
	},
});
</script>

<style lang="scss" scoped>
@import '@/styles/mixins/form-grid';

.grid {
	@include form-grid;

	&-element {
		&.full {
			grid-column: start/full;
		}
	}
}
</style>
