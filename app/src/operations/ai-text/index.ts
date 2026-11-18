import { defineOperationApp } from '@directus/extensions';
import { getModelChoices } from './fields';
import OptionsComponent from './options.vue';

export default defineOperationApp({
	id: 'ai-text',
	icon: 'text_fields',
	name: '$t:operations.ai-text.name',
	description: '$t:operations.ai-text.description',
	overview: ({ model, output, schema }) => {
		const choice = getModelChoices().find((c) => c.value === model);

		return [
			{ label: '$t:ai.flow_operations.model', text: choice?.text ?? model ?? '--' },
			{
				label: '$t:operations.ai-text.returns',
				text: output === 'object' ? getKeys(schema) : '$t:text',
			},
		];
	},
	// OperationAppConfig types component options as `never` (Exclude<ComponentOptions, any>), though the drawer renders them
	options: OptionsComponent as never,
});

function getKeys(schema: unknown) {
	let parsed = schema;

	try {
		if (typeof schema === 'string') parsed = JSON.parse(schema);
	} catch {
		return '--';
	}

	return Object.keys((parsed as { properties?: object } | null)?.properties ?? {}).join(', ') || '--';
}
