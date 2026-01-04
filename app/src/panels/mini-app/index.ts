import { useApi } from '@directus/composables';
import { definePanel } from '@directus/extensions';
import { reactive } from 'vue';
import PanelMiniApp from './panel-mini-app.vue';
import PreviewSVG from './preview.svg?raw';

const schemaCache = reactive<Record<string, any[]>>({});
const loadingStates = reactive<Record<string, boolean>>({});

export default definePanel({
	id: 'mini-app',
	name: 'Mini-App',
	icon: 'apps',
	description: 'Embed a mini-app from your library into your dashboard.',
	preview: PreviewSVG,
	component: PanelMiniApp,
	options: (panel: any) => {
		const staticFields = [
			{
				field: 'miniAppId',
				name: 'Mini App',
				type: 'uuid',
				meta: {
					interface: 'collection-item-dropdown',
					options: {
						selectedCollection: 'directus_minis',
						template: '{{icon}} {{name}}',
						filter: {
							status: {
								_eq: 'published',
							},
						},
					},
					width: 'full',
				},
			},
		];

		const options = panel?.options || {};
		const miniAppIdRaw = options.miniAppId;
		const miniAppId = typeof miniAppIdRaw === 'object' ? miniAppIdRaw?.key : miniAppIdRaw;

		if (miniAppId && typeof miniAppId === 'string') {
			if (schemaCache[miniAppId] === undefined && !loadingStates[miniAppId]) {
				loadingStates[miniAppId] = true;
				const api = useApi();

				api
					.get(`/minis/${miniAppId}`, {
						params: {
							fields: ['panel_config_schema'],
						},
					})
					.then((response) => {
						let schema = response.data.data.panel_config_schema || [];

						if (typeof schema === 'string') {
							try {
								schema = JSON.parse(schema);
							} catch {
								schema = [];
							}
						}

						schemaCache[miniAppId] = Array.isArray(schema) ? schema : [];
					})
					.catch(() => {
						schemaCache[miniAppId] = [];
					})
					.finally(() => {
						loadingStates[miniAppId] = false;
					});
			}
		}

		const dynamicFields = miniAppId && typeof miniAppId === 'string' ? schemaCache[miniAppId] || [] : [];

		return [
			...staticFields,
			...(dynamicFields.length > 0
				? [
						{
							field: 'configDivider',
							type: 'alias',
							meta: {
								interface: 'presentation-divider',
								options: {
									title: 'App Configuration',
								},
								width: 'full',
							},
						},
						...dynamicFields,
					]
				: []),
		];
	},
	minWidth: 18,
	minHeight: 12,
});
