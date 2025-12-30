import SystemPermissionsInterface from './system-permissions.vue';
import { defineInterface } from '@directus/extensions';

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
