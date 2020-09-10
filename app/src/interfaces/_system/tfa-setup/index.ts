import InterfaceTFASetup from './tfa-setup.vue';
import { defineInterface } from '@/interfaces/define';

export default defineInterface({
	id: 'tfa-setup',
	name: 'tfa-setup',
	icon: 'box',
	component: InterfaceTFASetup,
	types: ['text'],
	options: [],
	system: true,
});
