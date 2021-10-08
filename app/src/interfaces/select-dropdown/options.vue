<template>
	<div>
		<v-form v-model="options" :fields="dropdownOptions" />
	</div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import { Field } from '@directus/shared/types';

export default defineComponent({
	props: {
		fieldData: {
			type: Object as PropType<Field>,
			default: null,
		},
		value: {
			type: Object,
			default: null,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const options = computed({
			get() {
				return props.value || {};
			},
			set(options: Record<string, unknown>) {
				emit('input', options);
			},
		});

		const dropdownOptions = [
			{
				field: 'choices',
				type: 'json',
				name: '$t:choices',
				meta: {
					width: 'full',
					interface: 'list',
					options: {
						placeholder: '$t:interfaces.select-dropdown.choices_placeholder',
						template: '{{ text }}',
						fields: [
							{
								field: 'text',
								type: 'string',
								name: '$t:text',
								meta: {
									interface: 'input',
									width: 'half',
									options: {
										placeholder: '$t:interfaces.select-dropdown.choices_name_placeholder',
									},
								},
							},
							{
								field: 'value',
								type: props.fieldData?.type || 'string',
								name: '$t:value',
								meta: {
									interface: 'input',
									options: {
										font: 'monospace',
										placeholder: '$t:interfaces.select-dropdown.choices_value_placeholder',
									},
									width: 'half',
								},
							},
						],
					},
				},
			},
			{
				field: 'allowOther',
				name: '$t:interfaces.select-dropdown.allow_other',
				type: 'boolean',
				meta: {
					width: 'half',
					interface: 'boolean',
					options: {
						label: '$t:interfaces.select-dropdown.allow_other_label',
					},
				},
				schema: {
					default_value: false,
				},
			},
			{
				field: 'allowNone',
				name: '$t:interfaces.select-dropdown.allow_none',
				type: 'boolean',
				meta: {
					width: 'half',
					interface: 'boolean',
					options: {
						label: '$t:interfaces.select-dropdown.allow_none_label',
					},
				},
				schema: {
					default_value: false,
				},
			},
			{
				field: 'icon',
				name: '$t:icon',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'select-icon',
				},
			},
			{
				field: 'placeholder',
				name: '$t:placeholder',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'input',
					options: {
						placeholder: '$t:enter_a_placeholder',
					},
				},
			},
		];

		return { dropdownOptions, options };
	},
});
</script>
