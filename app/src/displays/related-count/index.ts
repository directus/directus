import { defineDisplay } from '@directus/shared/utils';
import RelatedCount from './related-count.vue';

export default defineDisplay({
	id: 'related-count',
	name: 'Related Count',
	icon: 'functions',
	description: 'Display the total number of related items',
	component: RelatedCount,
	handler: (value, options) => {
		const prefix = options.prefix ?? '';
		const suffix = options.suffix ?? '';

		return `${prefix}${value}${suffix}`;
	},
	options: [
		{
			field: 'format',
			name: '$t:displays.formatted-value.format',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'boolean',
				options: {
					label: '$t:displays.formatted-value.format_label',
				},
			},
			schema: {
				default_value: false,
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
			field: 'italic',
			name: '$t:displays.formatted-value.italic',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'boolean',
				options: {
					label: '$t:displays.formatted-value.italic_label',
				},
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'prefix',
			name: '$t:displays.formatted-value.prefix',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'system-input-translated-string',
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
				interface: 'system-input-translated-string',
				options: {
					label: '$t:displays.formatted-value.suffix_label',
					trim: false,
				},
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
			field: 'background',
			name: '$t:displays.formatted-value.background',
			type: 'string',
			meta: {
				interface: 'select-color',
				width: 'half',
			},
		},
		{
			field: 'icon',
			name: '$t:displays.formatted-value.icon',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'select-icon',
			},
		},
		{
			field: 'border',
			name: '$t:displays.formatted-value.border',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'boolean',
				options: {
					label: '$t:displays.formatted-value.border_label',
				},
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'conditionalFormatting',
			type: 'json',
			name: '$t:conditional_styles',
			meta: {
				interface: 'list',
				width: 'full',
				options: {
					template: '{{operator}} {{value}}',
					fields: [
						{
							field: 'operator',
							name: '$t:operator',
							type: 'string',
							schema: {
								default_value: 'eq',
							},
							meta: {
								interface: 'select-dropdown',
								options: {
									choices: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'].map((operator) => ({
										text: `$t:operators.${operator}`,
										value: operator,
									})),
								},
								width: 'half',
							},
						},
						{
							field: 'value',
							name: '$t:value',
							type: 'integer',
							schema: {
								default_value: 0,
							},
							meta: {
								interface: 'input',
								width: 'half',
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
							field: 'background',
							name: '$t:displays.formatted-value.background',
							type: 'string',
							meta: {
								interface: 'select-color',
								width: 'half',
							},
						},
						{
							field: 'text',
							name: '$t:displays.formatted-value.text',
							type: 'string',
							meta: {
								interface: 'system-input-translated-string',
								width: 'half',
								options: {
									placeholder: '$t:displays.formatted-value.text_placeholder',
								},
							},
						},
						{
							field: 'icon',
							name: '$t:displays.formatted-value.icon',
							type: 'string',
							meta: {
								width: 'half',
								interface: 'select-icon',
							},
						},
					],
				},
			},
		},
	],
	types: ['alias'],
	localTypes: ['m2m', 'o2m', 'translations', 'm2a', 'file', 'files'],
	fields: ['count()'],
});
