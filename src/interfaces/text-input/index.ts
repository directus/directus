import InterfaceTextInput from './text-input.vue';
import { defineInterface } from '@/interfaces/define';
import formatTitle from '@directus/format-title';

export default defineInterface({
	id: 'text-input',
	register: ({ i18n }) => ({
		name: i18n.t('interfaces.text-input.text-input'),
		icon: 'box',
		component: InterfaceTextInput,
		display: (value) => {
			return formatTitle(value);
		},
	}),
});
