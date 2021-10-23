import { defineInterface } from '@directus/shared/utils';
import InterfaceFiles from './files.vue';
// import Options from '../list-m2m/options.vue';
import PreviewSVG from './preview.svg?raw';

export default defineInterface({
	id: 'files',
	name: '$t:interfaces.files.files',
	description: '$t:interfaces.files.description',
	icon: 'note_add',
	component: InterfaceFiles,
	relational: true,
	types: ['alias'],
	localTypes: ['files'],
	group: 'relational',
	// options: Options,
	options: [],
	recommendedDisplays: ['related-values'],
	preview: PreviewSVG,
});
