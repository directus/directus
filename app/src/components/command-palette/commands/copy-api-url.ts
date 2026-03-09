import { i18n } from '@/lang';
import { getPublicURL } from '@/utils/get-root-path';
import { defineCommands } from '../composables/use-command-registry';

export const copyApiUrlCommands = defineCommands({
	commands: ({ route }) => {
		const { collection, primaryKey } = route.params as {
			collection: string | undefined;
			primaryKey: string | undefined;
		};

		const t = i18n.global.t;

		return collection
			? [
					{
						id: 'copy-api-url',
						name: t('command_copy_api_url'),
						icon: 'content_copy',
						group: 'context',
						action: () => {
							const path = `items/${collection}${primaryKey ? `/${primaryKey}` : ''}`;
							const url = new URL(path, getPublicURL());
							navigator.clipboard?.writeText(url.toString());
						},
					},
				]
			: [];
	},
});
