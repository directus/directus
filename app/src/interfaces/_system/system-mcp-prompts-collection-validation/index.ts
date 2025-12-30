import InterfaceMcpPromptsCollectionValidation from './system-mcp-prompts-collection-validation.vue';
import { defineInterface } from '@directus/extensions';

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
