import InterfaceList from './list.vue';
import RepeaterOptions from './options.vue';
import PreviewSVG from './preview.svg?raw';
import { defineInterface } from '@directus/extensions';
import { ComponentOptions } from 'vue';

export default defineInterface({
	id: 'list',
	name: '$t:interfaces.list.repeater',
	description: '$t:interfaces.list.description',
	icon: 'replay',
	component: InterfaceList,
	types: ['json'],
	group: 'selection',
	options: RepeaterOptions as ComponentOptions,
	preview: PreviewSVG,
});
