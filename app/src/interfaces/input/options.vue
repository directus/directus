<template>
	<div>
		<v-form :fields="fields" v-model="options" />
	</div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import { Field } from '@/types';

export default defineComponent({
	emits: ['input'],
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
	setup(props, { emit }) {
		const options = computed({
			get() {
				return props.value || {};
			},
			set(options: Record<string, unknown>) {
				emit('input', options);
			},
		});

		const textOptions = [
			{
				field: 'placeholder',
				name: '$t:placeholder',
				meta: {
					width: 'half',
					interface: 'input',
					options: {
						placeholder: '$t:enter_a_placeholder',
					},
				},
			},
			{
				field: 'font',
				name: '$t:font',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'select-dropdown',
					options: {
						choices: [
							{ text: '$t:sans_serif', value: 'sans-serif' },
							{ text: '$t:monospace', value: 'monospace' },
							{ text: '$t:serif', value: 'serif' },
						],
					},
				},
				schema: {
					default_value: 'sans-serif',
				},
			},
			{
				field: 'iconLeft',
				name: '$t:icon_left',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'select-icon',
				},
			},
			{
				field: 'iconRight',
				name: '$t:icon_right',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'select-icon',
				},
			},
			{
				field: 'trim',
				name: '$t:interfaces.input.trim',
				type: 'boolean',
				meta: {
					width: 'half',
					interface: 'boolean',
					options: {
						label: '$t:interfaces.input.trim_label',
					},
				},
				schema: {
					default_value: false,
				},
			},
			{
				field: 'masked',
				name: '$t:interfaces.input.mask',
				type: 'boolean',
				meta: {
					width: 'half',
					interface: 'boolean',
					options: {
						label: '$t:interfaces.input.mask_label',
					},
				},
				schema: {
					default_value: false,
				},
			},
			{
				field: 'clear',
				name: '$t:interfaces.input.clear',
				type: 'boolean',
				meta: {
					width: 'half',
					interface: 'boolean',
					options: {
						label: '$t:interfaces.input.clear_label',
					},
				},
				schema: {
					default_value: false,
				},
			},
			{
				field: 'slug',
				name: '$t:interfaces.input.slug',
				type: 'boolean',
				meta: {
					width: 'half',
					interface: 'boolean',
					options: {
						label: '$t:interfaces.input.slug_label',
					},
				},
				schema: {
					default_value: false,
				},
			},
		];

		const numberOptions = [
			{
				field: 'min',
				name: '$t:interfaces.input.minimum_value',
				type: 'integer',
				meta: {
					width: 'half',
					interface: 'input',
				},
			},
			{
				field: 'max',
				name: '$t:interfaces.input.maximum_value',
				type: 'integer',
				meta: {
					width: 'half',
					interface: 'input',
				},
			},
			{
				field: 'step',
				name: '$t:interfaces.input.step_interval',
				type: 'integer',
				meta: {
					width: 'half',
					interface: 'input',
				},
				schema: {
					default_value: 1,
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
			{
				field: 'iconLeft',
				name: '$t:icon_left',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'select-icon',
				},
			},
			{
				field: 'iconRight',
				name: '$t:icon_right',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'select-icon',
				},
			},
			{
				field: 'font',
				name: '$t:font',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'select-dropdown',
					options: {
						choices: [
							{ text: '$t:sans_serif', value: 'sans-serif' },
							{ text: '$t:monospace', value: 'monospace' },
							{ text: '$t:serif', value: 'serif' },
						],
					},
				},
				schema: {
					default_value: 'sans-serif',
				},
			},
		];

		const fields = computed(() => {
			if (['bigInteger', 'integer', 'float', 'decimal'].includes(props.fieldData?.type)) {
				return numberOptions;
			}

			return textOptions;
		});

		return { fields, options };
	},
});
</script>
