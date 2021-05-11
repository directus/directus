import { defineLayout } from '@/layouts/define';
import CalendarLayout from './calendar.vue';

export default defineLayout({
	id: 'calendar',
	name: '$t:layouts.calendar.calendar',
	icon: 'event',
	component: CalendarLayout,
});
