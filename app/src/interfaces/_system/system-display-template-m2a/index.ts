import { defineInterface } from '@directus/shared/utils';
import InterfaceSystemDisplayTemplateM2A from './system-display-template-m2a.vue';

export default defineInterface({
	id: 'system-display-template-m2a',
	name: '$t:interfaces.system-display-template.display-template',
	description: '$t:interfaces.system-display-template.description',
	icon: 'arrow_drop_down_circle',
	component: InterfaceSystemDisplayTemplateM2A,
	types: ['json'],
	system: true,
	options: [],
});
