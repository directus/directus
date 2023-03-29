import { useServerStore } from '@/stores/server';
import { DeepPartial, Field } from '@directus/shared/types';
import { defineOperationApp } from '@directus/shared/utils';
import { i18n } from '@/lang';

export default defineOperationApp({
	id: 'exec',
	icon: 'code',
	name: '$t:operations.exec.name',
	description: '$t:operations.exec.description',
	overview: () => [],
	options: () => {
		const { t } = i18n.global;

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
					name: '$t:interfaces.presentation-notice.notice',
					type: 'alias',
					meta: {
						width: 'full',
						interface: 'presentation-notice',
						options: {
							text:
								t('operations.exec.modules') +
								`<br>${serverStore.info.flows.execAllowedModules.map((mod) => `\`${mod}\``).join(', ')}`,
						},
					},
				},
			];
		}

		return standard;
	},
});
