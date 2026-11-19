import { defineInterface } from '@directus/extensions';
import InterfaceSystemOpenRouterModels from './system-openrouter-models.vue';

export default defineInterface({
	id: 'system-openrouter-models',
	name: '$t:interfaces.system-openrouter-models.name',
	description: '$t:interfaces.system-openrouter-models.description',
	icon: 'smart_toy',
	component: InterfaceSystemOpenRouterModels,
	types: ['json'],
	options: [],
	system: true,
});
