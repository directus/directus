import { defineEditor } from '@directus/extensions-sdk';
import EditorComponent from './editor.vue';

export default defineEditor({
	id: 'custom',
	name: 'Custom',
	icon: 'box',
	component: EditorComponent,
});
