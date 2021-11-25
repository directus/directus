import { defineDisplay } from '@directus/shared/utils';
import DisplayFormattedValue from './formatted-value.vue';

export default defineDisplay({
	id: 'formatted-value',
	name: '$t:displays.formatted-value.formatted-value',
	description: '$t:displays.formatted-value.description',
	types: ['string', 'text', 'integer', 'float', 'decimal', 'bigInteger'],
	icon: 'text_format',
	component: DisplayFormattedValue,
	options: ({ field }) => {
		const display_options = field.meta.display_options || {};

		const options = [
			{
				field: 'prefix',
				name: '$t:displays.formatted-value.prefix',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'input',
					options: {
						label: '$t:displays.formatted-value.prefix_label',
						trim: false,
					},
				},
			},
			{
				field: 'suffix',
				name: '$t:displays.formatted-value.suffix',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'input',
					options: {
						label: '$t:displays.formatted-value.suffix_label',
						trim: false,
					},
				},
			},
			{
				field: 'bold',
				name: '$t:displays.formatted-value.bold',
				type: 'boolean',
				meta: {
					width: 'half',
					interface: 'boolean',
					options: {
						label: '$t:displays.formatted-value.bold_label',
					},
				},
				schema: {
					default_value: false,
				},
			},
			{
				field: 'color',
				name: '$t:displays.formatted-value.color',
				type: 'string',
				meta: {
					interface: 'select-color',
					width: 'half',
				},
			},
			{
				field: 'iconLeft',
				name: '$t:displays.formatted-value.icon_left',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'select-icon',
				},
			},
			{
				field: 'iconRight',
				name: '$t:displays.formatted-value.icon_right',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'select-icon',
				},
			},
			{
				field: 'iconLeftColor',
				name: '$t:displays.formatted-value.icon_left_color',
				meta: {
					width: 'half',
					interface: 'select-color',
				},
			},
			{
				field: 'iconRightColor',
				name: '$t:displays.formatted-value.icon_right_color',
				meta: {
					width: 'half',
					interface: 'select-color',
				},
			},
			{
				field: 'font',
				name: '$t:displays.formatted-value.font',
				meta: {
					width: 'half',
					interface: 'select-dropdown',
					options: {
						choices: [
							{ text: '$t:displays.formatted-value.font_sans_serif', value: 'sans-serif' },
							{ text: '$t:displays.formatted-value.font_serif', value: 'serif' },
							{ text: '$t:displays.formatted-value.font_monospace', value: 'monospace' },
						],
					},
				},
				schema: {
					default_value: 'sans-serif',
				},
			},
		];

		if (['string', 'text'].includes(field.type)) {
			options.push({
				field: 'formatTitle',
				name: '$t:displays.formatted-value.format_title',
				type: 'boolean',
				meta: {
					width: 'half',
					interface: 'boolean',
					options: {
						label: '$t:displays.formatted-value.format_title_label',
					},
				},
				schema: {
					default_value: false,
				},
			});
		}

		options.push({
			field: 'link',
			name: '$t:displays.formatted-value.link',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'boolean',
				options: {
					label: '$t:displays.formatted-value.link_label',
				},
			},
			schema: {
				default_value: false,
			},
		});

		if (display_options.link) {
			options.push({
				field: 'linkTemplate',
				name: '$t:displays.formatted-value.link_template',
				type: 'string',
				meta: {
					width: 'half',
					interface: 'input',
					options: {
						label: '$t:displays.formatted-value.link_template_label',
					},
				},
				schema: {
					default_value: '{{value}}',
				},
			});
		}

		if (['bigInteger', 'integer', 'float', 'decimal'].includes(field.type)) {
			options.push({
				field: 'formatRules',
				name: '$t:displays.formatted-value.format_rules',
				type: 'json',
				meta: {
					interface: 'list',
					options: {
						template: '{{operator}}',
						fields: [
							{
								field: 'operator',
								name: '$t:displays.formatted-value.format_rules_operator',
								meta: {
									width: 'half',
									interface: 'select-dropdown',
									options: {
										choices: [
											{ text: '$t:operators.lt', value: 'lt' },
											{ text: '$t:operators.lte', value: 'lte' },
											{ text: '$t:operators.gt', value: 'gt' },
											{ text: '$t:operators.gte', value: 'gte' },
											{ text: '$t:operators.eq', value: 'eq' },
											{ text: '$t:operators.neq', value: 'neq' },
										],
									},
								},
								schema: {
									default_value: 'lt',
								},
							},
							{
								field: 'color',
								name: '$t:displays.formatted-value.color',
								type: 'string',
								meta: {
									interface: 'select-color',
									width: 'half',
								},
							},
							{
								field: 'iconLeft',
								name: '$t:displays.formatted-value.icon_left',
								type: 'string',
								meta: {
									width: 'half',
									interface: 'select-icon',
								},
							},
							{
								field: 'iconRight',
								name: '$t:displays.formatted-value.icon_right',
								type: 'string',
								meta: {
									width: 'half',
									interface: 'select-icon',
								},
							},
							{
								field: 'iconLeftColor',
								name: '$t:displays.formatted-value.icon_left_color',
								meta: {
									width: 'half',
									interface: 'select-color',
								},
							},
							{
								field: 'iconRightColor',
								name: '$t:displays.formatted-value.icon_right_color',
								meta: {
									width: 'half',
									interface: 'select-color',
								},
							},
						],
					},
				},
			});
		}

		return options;
	},
});
