import { defineInterface } from '@directus/shared/utils';
import RepeaterOptions from './options.vue';
import InterfaceList from './list.vue';
import PreviewSVG from './preview.svg?raw';

export default defineInterface({
	id: 'list',
	name: '$t:interfaces.list.repeater',
	description: '$t:interfaces.list.description',
	icon: 'replay',
	component: InterfaceList,
	types: ['json'],
	group: 'selection',
	options: RepeaterOptions,
	preview: PreviewSVG,
});
