import { defineDisplay } from '@directus/extensions';
import { JsonValue } from '@directus/types';
import { Scope, render } from 'micromustache';
import DisplayJsonValue from './formatted-json-value.vue';

export default defineDisplay({
	id: 'formatted-json-value',
	name: '$t:displays.formatted-json-value.formatted-json-value',
	description: '$t:displays.formatted-json-value.description',
	types: ['json', 'geometry'],
	icon: 'settings_ethernet',
	component: DisplayJsonValue,
	handler: (value: JsonValue | null, { format }) => {
		if (!value) return null;

		const values = Array.isArray(value) ? value : [value];

		try {
			return values
				.map((item) => {
					if (format) {
						return render(format, item as Scope);
					} else {
						return typeof item === 'string' ? item : JSON.stringify(item);
					}
				})
				.join(', ');
		} catch {
			return null;
		}
	},
	options: [
		{
			field: 'format',
			name: '$t:display_template',
			type: 'string',
			meta: {
				width: 'full',
				interface: 'input',
				options: {
					placeholder: '{{ field }}',
				},
			},
		},
	],
});
