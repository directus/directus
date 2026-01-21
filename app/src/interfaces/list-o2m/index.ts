import { defineInterface } from '@directus/extensions';
import InterfaceListO2M from './list-o2m.vue';
import PreviewSVG from './preview.svg?raw';
import {
	getCommonOptions,
	getO2MSpecificOptions,
	type ListRelationOptionsConfig,
} from '../shared/list-relation-options';

export default defineInterface({
	id: 'list-o2m',
	name: '$t:interfaces.list-o2m.one-to-many',
	description: '$t:interfaces.list-o2m.description',
	icon: 'arrow_right_alt',
	component: InterfaceListO2M,
	types: ['alias'],
	localTypes: ['o2m'],
	group: 'relational',
	relational: true,
	options: ({ relations, field: { meta } }) => {
		const collection = relations.o2m?.collection;
		const options = meta?.options ?? {};

		const config: ListRelationOptionsConfig = {
			collection: collection || undefined,
			options,
			interfaceType: 'o2m',
		};

		return [...getCommonOptions(config), ...getO2MSpecificOptions(collection)] as any;
	},
	recommendedDisplays: ['related-values'],
	preview: PreviewSVG,
});
