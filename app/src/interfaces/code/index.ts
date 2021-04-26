import { defineInterface } from '@/interfaces/define';
import InterfaceCode from './code.vue';
import CodeMirror from 'codemirror';
import 'codemirror/mode/meta';

const choicesMap = CodeMirror.modeInfo.reduce((acc: Record<string, string>, choice) => {
	if (['JSON', 'JSON-LD'].includes(choice.name)) {
		acc['JSON'] = 'JSON';
		return acc;
	}

	if (choice.mode == null || choice.mode == 'null') {
		choice.mode = 'plaintext';
	}

	if (choice.mode in acc) {
		acc[choice.mode] += ' / ' + choice.name;
	} else {
		acc[choice.mode] = choice.name;
	}

	return acc;
}, {});

const choices = Object.entries(choicesMap).map(([key, value]) => ({
	text: value,
	value: key,
}));

export default defineInterface({
	id: 'code',
	name: '$t:interfaces.code.code',
	description: '$t:interfaces.code.description',
	icon: 'code',
	component: InterfaceCode,
	types: ['string', 'json', 'text'],
	options: [
		{
			field: 'language',
			name: '$t:language',
			type: 'string',
			meta: {
				width: 'half',
				interface: 'dropdown',
				options: { choices },
			},
		},
		{
			field: 'lineNumber',
			name: '$t:interfaces.code.line_number',
			type: 'boolean',
			meta: {
				width: 'half',
				interface: 'toggle',
			},
			schema: {
				default_value: false,
			},
		},
		{
			field: 'template',
			name: '$t:template',
			type: 'text',
			meta: {
				width: 'full',
				interface: 'code',
				options: {
					placeholder: '$t:interfaces.code.placeholder',
				},
			},
			schema: {
				default_value: null,
			},
		},
	],
});
