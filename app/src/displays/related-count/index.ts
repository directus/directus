import { h } from 'vue';
import { defineDisplay } from '@directus/shared/utils';
import { get } from 'lodash';
import { ValueNull } from '@/views/private/components/value-null';

export default defineDisplay({
	id: 'related-count',
	name: 'Related Count',
	icon: 'functions',
	description: 'Display the total number of related items',
	component: ({ field, item, showZero, suffix }: { field: string; item: any; showZero: boolean; suffix: string }) => {
		const count = get(item, `${field}_count`);
		if (!count && !showZero) {
			return h(ValueNull);
		}
		return `${count} ${suffix}`;
	},
	options: [
		{
			field: 'showZero',
			name: '$t:show_zero',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'boolean',
				options: {
					label: '$t:show_zero',
				},
			},
			schema: {
				default_value: false,
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
			schema: {
				default_value: '$t:items',
			},
		},
	],
	types: ['alias'],
	localTypes: ['m2m', 'o2m', 'translations', 'm2a', 'file', 'files'],
	fields: ['count()'],
});
