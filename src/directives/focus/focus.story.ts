import Vue from 'vue';
import VInput from '../../components/v-input';
import Focus from './focus';
import markdown from './readme.md';
import { defineComponent } from '@vue/composition-api';
import withPadding from '../../../.storybook/decorators/with-padding';

Vue.component('v-input', VInput);
Vue.directive('focus', Focus);

export default {
	title: 'Directives / Focus',
	decorators: [withPadding],
	parameters: {
		notes: markdown,
	},
};

export const withText = () =>
	defineComponent({
		template: `
			<div style="display: flex; justify-content: space-around; flex-direction: column; align-items: center">
				<v-input style="margin-bottom: 20px;" />
				<v-input autofocus style="margin-bottom: 20px;" />
				<v-input style="margin-bottom: 20px;" />
			</div>
		`,
	});
