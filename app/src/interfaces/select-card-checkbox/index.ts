import { defineInterface } from '@directus/extensions';
import { getCardSelectOptions } from '../select-card/options';
import PreviewSVG from './preview.svg?raw';
import InterfaceSelectCardCheckbox from './select-card-checkbox.vue';

export default defineInterface({
	id: 'select-card-checkbox',
	name: '$t:interfaces.select-card-checkbox.card-select-multiple',
	description: '$t:interfaces.select-card-checkbox.description',
	icon: 'fact_check',
	component: InterfaceSelectCardCheckbox,
	types: ['json', 'csv'],
	recommendedDisplays: ['labels'],
	group: 'selection',
	preview: PreviewSVG,
	options: getCardSelectOptions('select-card-checkbox', 'string'),
});
