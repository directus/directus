import { definePanel } from '../define';
import PanelMetric from './metric.vue';

export default definePanel({
	id: 'metric',
	name: '$t:panels.metric.name',
	description: '$t:panels.metric.description',
	icon: 'functions',
	component: PanelMetric,
	options: [
		{
			field: 'all',
			name: 'All Options (Debug)',
			type: 'json',
			meta: {
				interface: 'code',
				options: {
					language: 'json',
				},
			},
		},
	],
	minWidth: 16,
	minHeight: 6,
});
