import { defineInterface } from '@directus/extensions';
import {
	getCommonOptions,
	getM2MSpecificOptions,
	type ListRelationOptionsConfig,
} from '../shared/list-relation-options';
import InterfaceListM2M from './list-m2m.vue';
import PreviewSVG from './preview.svg?raw';

export default defineInterface({
	id: 'list-m2m',
	name: '$t:interfaces.list-m2m.many-to-many',
	description: '$t:interfaces.list-m2m.description',
	icon: 'note_add',
	component: InterfaceListM2M,
	relational: true,
	types: ['alias'],
	localTypes: ['m2m'],
	group: 'relational',
	options: ({ editing, relations, field: { meta } }) => {
		const { collection, related_collection } = relations.m2o ?? {};
		const options = meta?.options ?? {};

		const config: ListRelationOptionsConfig = {
			collection: collection || undefined,
			relatedCollection: related_collection || undefined,
			options,
			editing,
			interfaceType: 'm2m',
		};

		return [...getCommonOptions(config), ...getM2MSpecificOptions()] as any;
	},
	recommendedDisplays: ['related-values'],
	preview: PreviewSVG,
});
