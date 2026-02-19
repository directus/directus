import { defineModule } from '@directus/extensions';
import { stringifyQuery } from 'vue-router';
import { useVisualEditorUrls } from './composables/use-visual-editor-urls';
import VisualEditor from './routes/visual-editor.vue';
import { getUrlRoute } from './utils/get-url-route';
import { normalizeUrl } from './utils/normalize-url';
import { analyzeTemplate, matchesTemplate } from './utils/version-url';

export default defineModule({
	id: 'visual',
	name: '$t:visual_editor',
	icon: 'edit_square',
	routes: [
		{
			name: 'visual-editor',
			path: '',
			redirect() {
				const { firstUrl } = useVisualEditorUrls();
				if (!firstUrl.value) return { name: 'visual-editor-no-url' };
				return getUrlRoute(firstUrl.value);
			},
		},
		{
			name: 'visual-editor-url',
			path: ':url(.*)',
			component: VisualEditor,
			props(route) {
				const queryString = stringifyQuery(route.query);

				return {
					dynamicUrl: normalizeUrl(`${route.params.url}${queryString ? `?${queryString}` : ''}${route.hash}`),
				};
			},
			beforeEnter(to) {
				const { urlTemplates, firstUrl } = useVisualEditorUrls();
				if (!firstUrl.value) return { name: 'visual-editor-no-url' };

				// if path is `/admin/visual/` with trailing slash
				if (!to.params.url) return getUrlRoute(firstUrl.value);

				const concreteUrl = String(to.params.url);

				const validUrl = urlTemplates.value.some((urlTemplate) => {
					const placement = analyzeTemplate(urlTemplate);
					return matchesTemplate(urlTemplate, concreteUrl, placement);
				});

				if (!validUrl) return { name: 'visual-editor-invalid-url' };
			},
		},
		{
			name: 'visual-editor-invalid-url',
			path: 'invalid-url',
			component: VisualEditor,
			props() {
				return { invalidUrl: true };
			},
		},
		{
			name: 'visual-editor-no-url',
			path: 'no-url',
			component: VisualEditor,
		},
	],
});
