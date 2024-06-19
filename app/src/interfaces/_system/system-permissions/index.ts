import { defineInterface } from '@directus/extensions';
import SystemPermissionsInterface from './system-permissions.vue';

export default defineInterface({
	id: 'system-permissions',
	name: '$t:permissions',
	component: SystemPermissionsInterface,
	icon: 'verified',
	types: ['alias'],
	localTypes: ['o2m'],
	relational: true,
	options: [],
	system: true,
});
