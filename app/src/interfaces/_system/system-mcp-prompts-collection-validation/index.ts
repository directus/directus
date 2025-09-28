import { defineInterface } from '@directus/extensions';
import InterfaceMcpPromptsCollectionValidation from './system-mcp-prompts-collection-validation.vue';

export default defineInterface({
	id: 'system-mcp-prompts-collection-validation',
	name: '$t:language',
	icon: 'translate',
	component: InterfaceMcpPromptsCollectionValidation,
	system: true,
	types: ['alias'],
	options: [],
	hideLabel: true,
});
