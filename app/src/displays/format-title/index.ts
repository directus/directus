import { defineDisplay } from '@/displays/define';
import handler from './handler';

export default defineDisplay({
	id: 'format-title',
	name: 'Format Title',
	icon: 'text_format',
	handler: handler,
	options: null,
	types: ['string'],
});
