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
	types: ['string', 'json', 'array'],
	options: [
		{
			field: 'template',
			name: i18n.t('template'),
			width: 'full',
			interface: 'code',
			default_value: null,
		},
		{
			field: 'lineNumber',
			name: i18n.t('line_number'),
			width: 'half',
			interface: 'toggle',
			default_value: false,
		},
		{
			field: 'language',
			name: i18n.t('language'),
			width: 'half',
			interface: 'dropdown',
			options: choices,
		},
		{
			field: 'altOptions',
			name: i18n.t('alt_options'),
			width: 'full',
			interface: 'code',
			default_value: null,
		},
	],
}));
