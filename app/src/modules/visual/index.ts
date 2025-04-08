import { stringifyQuery } from 'vue-router';
import VisualEditor from './routes/visual-editor.vue';
import { useSettingsStore } from '@/stores/settings';
import { defineModule } from '@directus/extensions';

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
				return { name: 'visual-editor-url', params: { url: firstUrl } };
			},
		},
		{
			name: 'visual-editor-url',
			path: ':url(.*)',
			component: VisualEditor,
			props(route) {
				const urls = getSettingsUrls();
				const queryString = stringifyQuery(route.query);
				return { urls, dynamicUrl: `${route.params.url}${queryString ? `?${queryString}` : ''}${route.hash}` };
			},
			beforeEnter(to) {
				const urls = getSettingsUrls();
				if (!urls.length) return { name: 'visual-editor-no-url' };

				const validUrl = urls.some((url) => sameOrigin(url, to.params.url as string));
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
	return settings?.visual_editor_urls?.map((item) => item.url).filter(Boolean) || [];
}

function sameOrigin(url1: string, url2: string) {
	try {
		return new URL(url1).origin === new URL(url2).origin;
	} catch {
		return false;
	}
}
