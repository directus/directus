import { defineDisplay } from '@directus/shared/utils';
import RelatedCount from './related-count.vue';
import { formattedFieldOptions } from '../formatted-value/index';

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
	options: formattedFieldOptions(false),
	types: ['alias'],
	localTypes: ['m2m', 'o2m', 'translations', 'm2a', 'file', 'files'],
	fields: ['count()'],
});
