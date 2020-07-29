import withPadding from '../../../.storybook/decorators/with-padding';
import { defineComponent, ref } from '@vue/composition-api';
import { boolean, withKnobs, optionsKnob } from '@storybook/addon-knobs';
import readme from './readme.md';
import i18n from '@/lang';
import RawValue from '../../../.storybook/raw-value.vue';
import CodeMirror from 'codemirror';
import 'codemirror/mode/meta';

const choices = {} as Record<string, string>;

CodeMirror.modeInfo.forEach((e) => (e.name === 'JSON' ? (choices[e.name] = 'JSON') : (choices[e.name] = e.mode)));

export default {
	title: 'Interfaces / Code',
	decorators: [withPadding, withKnobs],
	parameters: {
		notes: readme,
	},
};

export const basic = () =>
	defineComponent({
		components: { RawValue },
		i18n,
		props: {
			lineNumber: {
				default: boolean('Line Number', true),
			},
			disabled: {
				default: boolean('Disabled', false),
			},
			language: {
				default: optionsKnob('Language', choices, 'markdown', {
					display: 'select',
				}),
			},
		},
		setup(props) {
			const value = ref(
				`# This is the editor.
_It starts out in markdown mode_,
**use the control below to load and apply a mode**
"you'll see the highlighting of" this text *change*.`
			);
			return { value };
		},
		template: `
			<div :style="{
				maxWidth: '632px'
			}">
				<interface-code
					v-model="value"
					v-bind="{ lineNumber, disabled, language }"
				/>
				<raw-value>{{ value }}</raw-value>
			</div>
		`,
	});
