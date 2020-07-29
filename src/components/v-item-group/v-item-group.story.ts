import Vue from 'vue';
import { withKnobs, boolean, number } from '@storybook/addon-knobs';
import markdown from './readme.md';
import withPadding from '../../../.storybook/decorators/with-padding';
import VItemGroup from './v-item-group.vue';
import VItem from './v-item.vue';

Vue.component('v-item-group', VItemGroup);
Vue.component('v-item', VItem);

export default {
	title: 'Components / Item Group',
	component: VItemGroup,
	decorators: [withKnobs, withPadding],
	parameters: {
		notes: markdown,
	},
};

export const basic = () => ({
	data() {
		return {
			selection: null,
		};
	},
	props: {
		mandatory: {
			default: boolean('Mandatory', false),
		},
		max: {
			default: number('Max', -1),
		},
		multiple: {
			default: boolean('Multiple', false),
		},
	},
	template: `
	<div>
		<v-item-group v-model="selection" :multiple="multiple" style="display: flex; justify-content: space-around;" :max="max" :mandatory="mandatory">
			<v-item v-for="n in 5" v-slot:default="{ active, toggle }">
				<div @click="toggle" :style="{
					'background-color': active ? 'var(--blue)' : null,
					'color': active ? 'var(--white)' : 'var(--black)'
				}"
				style="display: flex; width: 150px; height: 30px; justify-content: center; align-items: center; border-radius: 5px"
				>
					I'm {{ active ? 'active ✨' : 'not active' }}
				</div>
			</v-item>
		</v-item-group>
		<pre style="max-width: max-content; margin-top: 20px; background-color: #eee; font-family: monospace; padding: 0.5rem; border-radius: 8px;">v-model value: {{JSON.stringify(selection)}}</pre>
	</div>
	`,
});

export const customValues = () => ({
	data() {
		return {
			selection: null,
		};
	},
	props: {
		mandatory: {
			default: boolean('Mandatory', false),
		},
		max: {
			default: number('Max', -1),
		},
		multiple: {
			default: boolean('Multiple', false),
		},
	},
	template: `
	<div>
		<v-item-group v-model="selection" :multiple="multiple" style="display: flex; justify-content: space-around;" :max="max" :mandatory="mandatory">
			<v-item v-for="value in ['item-a', 'item-2', 'unit 2', 'another value', 'what']" v-slot:default="{ active, toggle }" :key="value" :value="value">
				<div @click="toggle" 
					:style="{
						'background-color': active ? 'var(--blue)' : null,
						'color': active ? 'var(--white)' : 'var(--black)'
					}"
					style="display: flex; width: 150px; height: 30px; justify-content: center; align-items: center; border-radius: 5px"
				>
					I'm {{ active ? 'active ✨' : 'not active' }}
				</div>
			</v-item>
		</v-item-group>
		<pre style="max-width: max-content; margin-top: 20px; background-color: #eee; font-family: monospace; padding: 0.5rem; border-radius: 8px;">v-model value: {{JSON.stringify(selection)}}</pre>
	</div>
	`,
});
