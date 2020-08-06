import { defineInterface } from '@/interfaces/define';
import InterfaceCode from './code.vue';
import CodeMirror from 'codemirror';
import 'codemirror/mode/meta';

const choices = CodeMirror.modeInfo.map((e) => ({
	text: e.name,
	value: e.mode,
}));

choices.push({ text: 'JSON', value: 'JSON' });

export default defineInterface(({ i18n }) => ({
	id: 'code',
	name: i18n.t('code'),
	icon: 'code',
	component: InterfaceCode,
	types: ['string', 'json', 'text'],
	options: [
		{
			field: 'template',
			name: i18n.t('template'),
			type: 'text',
			meta: {
				width: 'full',
				interface: 'code',
				options: {
					language: 'text/plain'
				}
			},
			schema: {
				default_value: null,
			}
		},
		{
			field: 'lineNumber',
			name: i18n.t('line_number'),
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
			},
			schema: {
				default_value: false,
			}
		},
		{
			field: 'language',
			name: i18n.t('language'),
			type: 'string',
			meta: {
				width: 'half',
				interface: 'dropdown',
				options: { choices },
			},
		}
	],
}));
