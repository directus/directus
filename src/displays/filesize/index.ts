import { defineDisplay } from '@/displays/define';
import handler from './handler';

export default defineDisplay(({ i18n }) => ({
	id: 'filesize',
	name: i18n.t('filesize'),
	icon: 'description',
	handler: handler,
	options: null,
	types: ['integer'],
}));
