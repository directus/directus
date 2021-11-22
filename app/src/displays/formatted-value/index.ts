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
		const options = [
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
				field: 'textAlign',
				name: '$t:displays.formatted-value.text_align',
				type: 'string',
				meta: {
					interface: 'select-dropdown',
					width: 'half',
					options: {
						choices: [
							{ text: '$t:displays.formatted-value.text_align_left', value: 'left' },
							{ text: '$t:displays.formatted-value.text_align_center', value: 'center' },
							{ text: '$t:displays.formatted-value.text_align_right', value: 'right' },
						],
						allowOther: false,
					},
				},
				schema: {
					default_value: 'left',
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
		];

		if (['bigInteger', 'integer', 'float', 'decimal'].includes(field.type)) {
			options.push({
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
			});

			options.push({
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
			});

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
								field: 'value',
								name: '$t:value',
								type: 'number',
								meta: {
									interface: 'input',
									options: {
										step: 'any',
									},
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
								field: 'backgroundColor',
								name: '$t:displays.formatted-value.background_color',
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

			options.push({
				field: 'link',
				name: '$t:displays.formatted-value.link',
				type: 'string',
				meta: {
					interface: 'select-dropdown',
					width: 'half',
					options: {
						choices: [
							{ text: '$t:displays.formatted-value.no_link', value: '' },
							{ text: '$t:displays.formatted-value.link_url', value: 'url' },
							{ text: '$t:displays.formatted-value.link_email', value: 'email' },
							{ text: '$t:displays.formatted-value.link_tel', value: 'tel' },
							{ text: '$t:displays.formatted-value.link_whatsapp', value: 'whatsapp' },
						],
						allowOther: false,
					},
				},
				schema: {
					default_value: '',
				},
			});

			const display_options = field.meta.display_options || {};

			if (display_options.link) {
				options.push({
					field: 'linkText',
					name: '$t:displays.formatted-value.link_text',
					type: 'string',
					meta: {
						width: 'half',
						interface: 'input',
						options: {
							label: '$t:displays.formatted-value.link_text_label',
							trim: true,
						},
					},
				});

				options.push({
					field: 'linkTarget',
					name: '$t:displays.formatted-value.link_target',
					type: 'string',
					meta: {
						interface: 'select-dropdown',
						width: 'half',
						options: {
							choices: [
								{ text: '$t:displays.formatted-value.link_target_blank', value: '_blank' },
								{ text: '$t:displays.formatted-value.link_target_self', value: '_self' },
								{ text: '$t:displays.formatted-value.link_target_parent', value: '_parent' },
								{ text: '$t:displays.formatted-value.link_target_top', value: '_top' },
							],
							allowOther: false,
						},
					},
					schema: {
						default_value: '_blank',
					},
				});
			}

			if (display_options.link === 'email') {
				options.push({
					field: 'linkEmailSubject',
					name: '$t:displays.formatted-value.link_email_subject',
					type: 'string',
					meta: {
						width: 'full',
						interface: 'input',
						options: {
							label: '$t:displays.formatted-value.link_email_subject_label',
							trim: true,
						},
					},
				});

				options.push({
					field: 'linkEmailBody',
					name: '$t:displays.formatted-value.link_email_body',
					type: 'string',
					meta: {
						width: 'full',
						interface: 'input-multiline',
						options: {
							label: '$t:displays.formatted-value.link_email_body_label',
							trim: true,
						},
					},
				});

				options.push({
					field: 'linkEmailCC',
					name: '$t:displays.formatted-value.link_email_cc',
					type: 'string',
					meta: {
						width: 'full',
						interface: 'input',
						options: {
							label: '$t:displays.formatted-value.link_email_cc_label',
							trim: true,
						},
					},
				});

				options.push({
					field: 'linkEmailBCC',
					name: '$t:displays.formatted-value.link_email_bcc',
					type: 'string',
					meta: {
						width: 'full',
						interface: 'input',
						options: {
							label: '$t:displays.formatted-value.link_email_bcc_label',
							trim: true,
						},
					},
				});
			}

			if (display_options.link === 'whatsapp') {
				options.push({
					field: 'linkWhatsappText',
					name: '$t:displays.formatted-value.link_whatsapp_text',
					type: 'string',
					meta: {
						width: 'full',
						interface: 'input-multiline',
						options: {
							label: '$t:displays.formatted-value.link_whatsapp_text_label',
							trim: true,
						},
					},
				});
			}
		}

		return options;
	},
});
