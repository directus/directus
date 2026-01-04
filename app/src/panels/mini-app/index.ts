import { definePanel } from '@directus/extensions';
import PanelMiniApp from './panel-mini-app.vue';
import PreviewSVG from './preview.svg?raw';

export default definePanel({
	id: 'mini-app',
	name: 'Mini-App',
	icon: 'apps',
	description: 'Embed a mini-app from your library into your dashboard.',
	preview: PreviewSVG,
	component: PanelMiniApp,
	options: [
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
	],
	minWidth: 18,
	minHeight: 12,
});
