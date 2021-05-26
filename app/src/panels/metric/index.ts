import { definePanel } from '../define';
import PanelMetric from './metric.vue';

export default definePanel({
	id: 'metric',
	name: '$t:panels.metric.name',
	description: '$t:panels.metric.description',
	icon: 'functions',
	component: PanelMetric,
	options: [],
	minWidth: 16,
	minHeight: 6,
});
