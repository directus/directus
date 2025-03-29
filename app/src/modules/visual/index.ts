import VisualEditor from './routes/visual-editor.vue';
import { defineModule } from '@directus/extensions';

export default defineModule({
	id: 'visual',
	name: '$t:visual_editor',
	icon: 'edit_square',
	routes: [
		{
			name: 'visual-editor',
			path: '',
			component: VisualEditor,
		},
	],
});
