import { getEndpoint } from '@directus/utils';
import { i18n } from '@/lang';
import { getPublicURL } from '@/utils/get-root-path';
import { defineCommands } from '../composables/use-command-registry';
import { getRoutePrimaryKey } from '../utils/get-route-primary-key';

export const copyApiUrlCommands = defineCommands({
	commands: ({ route }) => {
		const { collection, primaryKey } = route.params as {
			collection: string | undefined;
			primaryKey: string | undefined;
		};
		const itemPrimaryKey = getRoutePrimaryKey(primaryKey);

		const t = i18n.global.t;

		if (!collection || !route.path.startsWith(`/content/${collection}`)) return [];

		return [
			{
				id: 'copy-api-url',
				name: t('command_copy_api_url'),
				icon: 'content_copy',
				group: 'context',
				action: () => {
					const endpoint = getEndpoint(collection).slice(1);
					const path = `${endpoint}${itemPrimaryKey ? `/${encodeURIComponent(itemPrimaryKey)}` : ''}`;
					const url = new URL(path, getPublicURL());
					navigator.clipboard?.writeText(url.toString());
				},
			},
		];
	},
});
