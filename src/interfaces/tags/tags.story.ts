import { withKnobs, boolean, text, array } from '@storybook/addon-knobs';
import markdown from './readme.md';
import withPadding from '../../../.storybook/decorators/with-padding';
import { action } from '@storybook/addon-actions';
import { defineComponent, ref } from '@vue/composition-api';
import RawValue from '../../../.storybook/raw-value.vue';
import i18n from '@/lang';

export default {
	title: 'Interfaces / Tags',
	decorators: [withKnobs, withPadding],
	parameters: {
		notes: markdown,
	},
};

export const basic = () =>
	defineComponent({
		i18n,
		components: { RawValue },
		props: {
			disabled: {
				default: boolean('Disabled', false, 'Options'),
			},
			presets: {
				default: array('Preset Values', [], ',', 'Options'),
			},
			value: {
				default: array('Value', [], ',', 'Options'),
			},
			allowCustom: {
				default: boolean('Allow Custom Values', true, 'Options'),
			},
			placeholder: {
				default: text('Placeholder', 'Click tags below, or add a new one here...', 'Options'),
			},
			lowercase: {
				default: boolean('Lowercase', false, 'Options'),
			},
			alphabetize: {
				default: boolean('Alphabetize', false, 'Options'),
			},
			iconLeft: {
				default: text('Icon Left', '', 'Options'),
			},
			iconRight: {
				default: text('Icon Right', 'local_offer', 'Options'),
			},
		},
		setup() {
			const onInput = action('input');
			return { onInput };
		},
		template: `
		<div>
			<interface-tags
				v-model="value"
				v-bind="{ disabled, presets, allowCustom, placeholder, lowercase, alphabetize, iconLeft, iconRight }"
				@input="onInput"
			/>
			<raw-value>{{ value }}</raw-value>
		</div>
		`,
	});

export const withPresets = () =>
	defineComponent({
		i18n,
		components: { RawValue },
		props: {
			disabled: {
				default: boolean('Disabled', false, 'Options'),
			},
			presets: {
				default: array(
					'Preset Values',
					[
						'Healthy',
						'Mexican',
						'Barbeque',
						'Chinese',
						'International',
						'Sushi',
						'Pizza',
						'Burger',
						'Asian',
						'Fast Food',
					],
					',',
					'Options'
				),
			},
			allowCustom: {
				default: boolean('Allow Custom Values', true, 'Options'),
			},
			placeholder: {
				default: text('Placeholder', 'Click tags below, or add a new one here...', 'Options'),
			},
			lowercase: {
				default: boolean('Lowercase', false, 'Options'),
			},
			alphabetize: {
				default: boolean('Alphabetize', false, 'Options'),
			},
			iconLeft: {
				default: text('Icon Left', '', 'Options'),
			},
			iconRight: {
				default: text('Icon Right', 'local_offer', 'Options'),
			},
		},
		setup() {
			const onInput = action('input');
			const value = ref<string[] | null>(null);
			return { onInput, value };
		},
		template: `
		<div>
			<interface-tags
				v-model="value"
				v-bind="{ disabled, presets, allowCustom, placeholder, lowercase, alphabetize, iconLeft, iconRight }"
				@input="onInput"
			/>
			<raw-value>{{ value }}</raw-value>
		</div>
		`,
	});
