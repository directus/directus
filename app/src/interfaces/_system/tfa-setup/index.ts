import { defineInterface } from '@/interfaces/define';
import InterfaceTFASetup from './tfa-setup.vue';

export default defineInterface({
	id: 'tfa-setup',
	name: 'tfa-setup',
	icon: 'box',
	component: InterfaceTFASetup,
	types: ['text'],
	options: [],
	system: true,
});
