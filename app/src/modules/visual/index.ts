import { defineModule } from '@directus/extensions';
import { stringifyQuery } from 'vue-router';
import VisualEditor from './routes/visual-editor.vue';
import { getUrlRoute } from './utils/get-url-route';
import { sameOrigin } from './utils/same-origin';
import { useSettingsStore } from '@/stores/settings';

export default defineModule({
	id: 'visual',
	name: '$t:visual_editor',
	icon: 'edit_square',
	routes: [
		{
			name: 'visual-editor',
			path: '',
			redirect() {
				const urls = getSettingsUrls();
				const firstUrl = urls[0];
				if (!firstUrl) return { name: 'visual-editor-no-url' };
				return getUrlRoute(firstUrl);
			},
		},
		{
			name: 'visual-editor-url',
			path: ':url(.*)',
			component: VisualEditor,
			props(route) {
				const urls = getSettingsUrls();
				const queryString = stringifyQuery(route.query);

				return {
					urls,
					dynamicUrl: normalizeUrl(`${route.params.url}${queryString ? `?${queryString}` : ''}${route.hash}`),
				};
			},
			beforeEnter(to) {
				const urls = getSettingsUrls();
				if (!urls.length) return { name: 'visual-editor-no-url' };

				// if path is `/admin/visual/` with trailing slash
				if (!to.params.url) return getUrlRoute(urls[0]!);

				const validUrl = urls.some((url) => sameOrigin(url, String(to.params.url)));
				if (!validUrl) return { name: 'visual-editor-invalid-url' };
			},
		},
		{
			name: 'visual-editor-invalid-url',
			path: 'invalid-url',
			component: VisualEditor,
			props() {
				const urls = getSettingsUrls();
				return { invalidUrl: true, urls };
			},
		},
		{
			name: 'visual-editor-no-url',
			path: 'no-url',
			component: VisualEditor,
		},
	],
});

function getSettingsUrls() {
	const { settings } = useSettingsStore();
	const settingsUrls = settings?.visual_editor_urls?.map((item) => item.url).filter(Boolean) || [];
	return settingsUrls.map(normalizeUrl).filter(Boolean);
}

function normalizeUrl(url: string) {
	try {
		return new URL(url).href.replace(/\/$/, '');
	} catch {
		return '';
	}
}
