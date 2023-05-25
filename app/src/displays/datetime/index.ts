import { i18n } from '@/lang';
import { localizedFormat } from '@/utils/localized-format';
import { localizedFormatDistance } from '@/utils/localized-format-distance';
import type { DeepPartial, Field } from '@directus/types';
import { defineDisplay } from '@directus/utils';
import { parse, parseISO } from 'date-fns';
import DisplayDateTime from './datetime.vue';

export default defineDisplay({
	id: 'datetime',
	name: '$t:displays.datetime.datetime',
	description: '$t:displays.datetime.description',
	icon: 'query_builder',
	component: DisplayDateTime,
	handler: (value, options, { field }) => {
		if (!value) return value;

		const relativeFormat = (value: Date) =>
			localizedFormatDistance(value, new Date(), {
				addSuffix: true,
			});

		if (field?.type === 'timestamp') {
			value = parseISO(value);
		} else if (field?.type === 'dateTime') {
			value = parse(value, "yyyy-MM-dd'T'HH:mm:ss", new Date());
		} else if (field?.type === 'date') {
			value = parse(value, 'yyyy-MM-dd', new Date());
		} else if (field?.type === 'time') {
			value = parse(value, 'HH:mm:ss', new Date());
		}

		if (options.relative) {
			return relativeFormat(value);
		} else {
			let format;

			if (options?.format === 'long') {
				format = `${i18n.global.t('date-fns_date')} ${i18n.global.t('date-fns_time')}`;
				if (field?.type === 'date') format = String(i18n.global.t('date-fns_date'));
				if (field?.type === 'time') format = String(i18n.global.t('date-fns_time'));
			} else if (options?.format === 'short') {
				format = `${i18n.global.t('date-fns_date_short')} ${i18n.global.t('date-fns_time_short')}`;
				if (field?.type === 'date') format = String(i18n.global.t('date-fns_date_short'));
				if (field?.type === 'time') format = String(i18n.global.t('date-fns_time_short'));
			} else {
				format = options?.format;
			}

			return localizedFormat(value, format);
		}
	},
	options: ({ field }) => {
		const options = field.meta?.display_options || {};

		const fields: DeepPartial<Field>[] = [
			{
				field: 'relative',
				name: '$t:displays.datetime.relative',
				type: 'boolean',
				meta: {
					width: 'half',
					interface: 'boolean',
					options: {
						label: '$t:displays.datetime.relative_label',
					},
				},
				schema: {
					default_value: false,
				},
			},
		];

		if (!options.relative) {
			fields.push({
				field: 'format',
				name: '$t:displays.datetime.format',
				type: 'string',
				meta: {
					interface: 'select-dropdown',
					width: 'half',
					options: {
						choices: [
							{ text: '$t:displays.datetime.long', value: 'long' },
							{ text: '$t:displays.datetime.short', value: 'short' },
						],
						allowOther: true,
					},
					note: '$t:displays.datetime.format_note',
				},
				schema: {
					default_value: 'long',
				},
			});
		} else {
			fields.push(
				{
					field: 'suffix',
					name: '$t:displays.datetime.suffix',
					type: 'boolean',
					meta: {
						width: 'half',
						interface: 'boolean',
						options: {
							label: '$t:displays.datetime.suffix_label',
						},
						note: '$t:displays.datetime.suffix_note',
					},
					schema: {
						default_value: true,
					},
				},
				{
					field: 'strict',
					name: '$t:displays.datetime.strict',
					type: 'boolean',
					meta: {
						width: 'half',
						interface: 'boolean',
						options: {
							label: '$t:displays.datetime.strict_label',
						},
						note: '$t:displays.datetime.strict_note',
					},
					schema: {
						default_value: false,
					},
				},
				{
					field: 'round',
					name: '$t:displays.datetime.round',
					type: 'string',
					meta: {
						width: 'half',
						interface: 'select-dropdown',
						options: {
							choices: [
								{ text: '$t:displays.datetime.down', value: 'floor' },
								{ text: '$t:displays.datetime.nearest', value: 'round' },
								{ text: '$t:displays.datetime.up', value: 'ceil' },
							],
						},
						note: '$t:displays.datetime.round_note',
					},
					schema: {
						default_value: 'round',
					},
				}
			);
		}

		return fields;
	},
	types: ['dateTime', 'date', 'time', 'timestamp'],
});
