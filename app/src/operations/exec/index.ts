import { useServerStore } from '@/stores/server';
import { DeepPartial, Field } from '@directus/shared/types';
import { defineOperationApp } from '@directus/shared/utils';

export default defineOperationApp({
	id: 'exec',
	icon: 'code',
	name: 'code',
	description: 'code',
	overview: () => [],
	options: () => {
		const serverStore = useServerStore();

		const standard: DeepPartial<Field>[] = [
			{
				field: 'code',
				name: '$t:code',
				type: 'string',
				meta: {
					width: 'full',
					interface: 'input-code',
					options: {
						language: 'javascript',
					},
				},
				schema: {
					default_value: `module.exports = async function(data) {
	// Do something...
	return {};
}`,
				},
			},
		];

		if (serverStore.info?.flows?.execAllowedModules && serverStore.info.flows.execAllowedModules.length > 0) {
			return [
				...standard,
				{
					field: 'notice',
					name: '$t:modules',
					type: 'alias',
					meta: {
						width: 'full',
						interface: 'presentation-notice',
						options: {
							text: `The following **Node Modules** can be used:<br>${serverStore.info.flows.execAllowedModules
								.map((mod) => `\`${mod}\``)
								.join(', ')}`,
						},
					},
				},
			];
		}

		return standard;
	},
});
