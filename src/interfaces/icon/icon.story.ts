import { withKnobs, boolean } from '@storybook/addon-knobs';
import Vue from 'vue';
import InterfaceIcon from './icon.vue';
import RawValue from '../../../.storybook/raw-value.vue';
import { i18n } from '@/lang';
import VueRouter from 'vue-router';

import markdown from './readme.md';
import withPadding from '../../../.storybook/decorators/with-padding';
import { defineComponent, ref } from '@vue/composition-api';

Vue.component('interface-icon', InterfaceIcon);

export default {
	title: 'Interfaces / Icon',
	decorators: [withKnobs, withPadding],
	parameters: {
		notes: markdown,
	},
};

export const basic = () =>
	defineComponent({
		i18n,
		router: new VueRouter(),
		components: { InterfaceIcon, RawValue },
		props: {
			disabled: {
				default: boolean('disabled', false, 'Options'),
			},
		},
		setup() {
			const value = ref('');
			return { value };
		},
		template: `
		<div style="width: 300px">
			<interface-icon v-model="value" :disabled="disabled" />
			<portal-target name="outlet" />
			<raw-value>{{value}}</raw-value>
		</div>
		`,
	});
