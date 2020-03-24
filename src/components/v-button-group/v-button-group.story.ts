import { withKnobs, boolean, number } from '@storybook/addon-knobs';
import markdown from './readme.md';
import withPadding from '../../../.storybook/decorators/with-padding';
import VButtonGroup from './v-button-group.vue';
import VItemGroup from '../v-item-group/';
import VButton from '../v-button/';
import { defineComponent, ref } from '@vue/composition-api';

export default {
	title: 'Components / Button Group',
	decorators: [withKnobs, withPadding],
	parameters: {
		notes: markdown,
	},
};

export const basic = () =>
	defineComponent({
		components: { VButtonGroup, VButton, VItemGroup },
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
			rounded: {
				default: boolean('Rounded', false),
			},
			tile: {
				default: boolean('Tile', false),
			},
		},
		setup() {
			const selection = ref([]);
			return { selection };
		},
		template: `
			<div>
				<v-button-group v-model="selection" :multiple="multiple" :max="max" :mandatory="mandatory" :rounded="rounded" :tile="tile">
					<v-button
						v-for="n in 5"
						:key="n"
						v-slot:default="{ active }"
					>
						I'm {{ active ? 'active ✨' : 'not active' }}
					</v-button>
				</v-button-group>
				<pre style="max-width: max-content; margin-top: 20px; background-color: #eee; font-family: monospace; padding: 0.5rem; border-radius: 8px;">v-model value: {{JSON.stringify(selection)}}</pre>
			</div>
		`,
	});

export const withCustomValues = () =>
	defineComponent({
		components: { VButtonGroup, VButton, VItemGroup },
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
			rounded: {
				default: boolean('Rounded', false),
			},
			tile: {
				default: boolean('Tile', false),
			},
		},
		setup() {
			const selection = ref([]);
			const buttonValues = ['value-1', 61, 'another-value', 'wowzers'];

			return { selection, buttonValues };
		},
		template: `
			<div>
				<v-button-group v-model="selection" :multiple="multiple" :max="max" :mandatory="mandatory" :rounded="rounded" :tile="tile">
					<v-button
						v-for="value in buttonValues"
						:key="value"
						v-slot:default="{ active }"
						:value="value"
					>
						I'm {{ active ? 'active ✨' : 'not active' }}
					</v-button>
				</v-button-group>
				<pre style="max-width: max-content; margin-top: 20px; background-color: #eee; font-family: monospace; padding: 0.5rem; border-radius: 8px;">v-model value: {{JSON.stringify(selection)}}</pre>
			</div>
		`,
	});
