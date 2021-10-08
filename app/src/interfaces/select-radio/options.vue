<template>
	<div>
		<v-form v-model="options" :fields="radioOptions" />
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

		const radioOptions = [
			{
				field: 'choices',
				type: 'json',
				name: '$t:choices',
				meta: {
					width: 'full',
					interface: 'list',
					options: {
						template: '{{ text }}',
						fields: [
							{
								field: 'text',
								type: 'string',
								name: '$t:text',
								meta: {
									width: 'half',
									interface: 'input',
								},
							},
							{
								field: 'value',
								type: props.fieldData?.type || 'string',
								name: '$t:value',
								meta: {
									width: 'half',
									interface: 'input',
									options: {
										font: 'monospace',
									},
								},
							},
						],
					},
				},
			},
			{
				field: 'iconOn',
				name: '$t:icon_on',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'select-icon',
				},
				schema: {
					default_value: 'radio_button_checked',
				},
			},
			{
				field: 'iconOff',
				name: '$t:icon_off',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'select-icon',
				},
				schema: {
					default_value: 'radio_button_unchecked',
				},
			},
			{
				field: 'color',
				name: '$t:color',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'select-color',
				},
			},
			{
				field: 'allowOther',
				name: '$t:interfaces.select-dropdown.allow_other',
				type: 'string',
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
		];

		return { radioOptions, options };
	},
});
</script>
