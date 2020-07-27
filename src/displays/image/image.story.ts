import withPadding from '../../../.storybook/decorators/with-padding';
import { withKnobs, boolean } from '@storybook/addon-knobs';
import readme from './readme.md';
import { defineComponent } from '@vue/composition-api';

export default {
	title: 'Displays / Image',
	decorators: [withPadding, withKnobs],
	parameters: {
		notes: readme,
	},
};

export const basic = () =>
	defineComponent({
		props: {
			circle: {
				default: boolean('Circle', false),
			},
		},
		setup() {
			const image = {
				type: 'png',
				data: {
					thumbnails: [
						{
							key: 'system-small-crop',
							url: 'https://demo.directus.io/thumper/assets/pnw7s9lqy68048g0?key=system-small-crop',
						},
					],
				},
			};
			return { image };
		},
		template: `
    <div style="max-width: 100px;">
      <display-image :circle="circle" :value="image"/>
    </div>
    `,
	});
