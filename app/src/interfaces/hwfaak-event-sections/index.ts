import { defineInterface } from '@directus/utils';
import Options from './options.vue';
import Interface from './interface.vue';

export default defineInterface({
	id: 'hwfaak-event-sections',
	name: '$t:interfaces.hwfaak-event-sections.name',
	description: '$t:interfaces.hwfaak-event-sections.description',
	icon: 'event',
	component: Interface,
	types: ['alias'],
	localTypes: ['o2m'],
	group: 'relational',
	options: Options,
	relational: true,
	recommendedDisplays: ['related-values'],
});
